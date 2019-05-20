module Demo.Stripe

open Suave
open Suave.Operators
open Suave.RequestErrors
open Suave.Successful
open Newtonsoft.Json.Linq

let clientConfig = Config.client >> jwrite HTTP_200 |> warbler

module Catalog =

    let rec listProducts (setup: bool) =
        pipeApiGet "/products" [("limit", "3")] >=> checkInit'd setup

    and private checkInit'd setup ctx =
        let emptyCatalogLength = 100 // HACK: empty catalog minimum length: {"object": "list", "data": []...
        match ctx.response.content with
        | Bytes xs when setup && Array.length xs < emptyCatalogLength -> async {
                do! Setup.initCatalog ctx
                return! listProducts false ctx }
        | _ -> succeed ctx

    let getProduct id = pipeApiGet ("/products/" + id) []

    let getSkus product = pipeApiGet "/skus" [("product", product)]

    let getSku id = apiget<{| price: int |}> ("/skus/" + id) []

module PaymentIntent =

    type ReqItem = { parent: string; quantity: int }

    let private calculateTotal (xs: ReqItem seq) ctx =
        xs
        |> Seq.map (fun x ->
            Catalog.getSku x.parent ctx
            |> Async.map (fun sku -> x.quantity * sku.price))
        |> Async.Parallel
        |> Async.map Seq.sum

    let create ctx = async {
        let data = jread<{| currency: string; items: ReqItem list |}> ctx
        let! amount = calculateTotal data.items ctx
        let payload = {|
            amount = string amount
            currency = data.currency
            payment_method_types = (Config.get ctx).paymentMethods |}
        let! result = apipost "/payment_intents" payload ctx
        return! jwrite HTTP_200 {| paymentIntent = result |} ctx }

    let getStatus id ctx = async {
        let! x = apiget<{| status: string |}> ("/payment_intents/" + id) [] ctx
        return! jwrite HTTP_200 {| paymentIntent = x |} ctx }

    let update id ctx = async {
        let data = jread<{| shippingOption: {| id: string|}; items: ReqItem list |}> ctx
        let! subtotal = calculateTotal data.items ctx
        let shippingCost =
            (Config.client ctx).shippingOptions
            |> Seq.find (fun x -> x.id = data.shippingOption.id)
            |> fun x -> x.amount
        let! result = apipost ("/payment_intents/" + id) {| amount = subtotal + shippingCost |} ctx
        return! jwrite HTTP_200 {| paymentIntent = result |} ctx }

    let confirm id (src: string) ctx = async {
        let! x = apiget<{| status: string |}> ("/payment_intents/" + id) [] ctx
        if x.status = "requires_payment_method" then
            do! apipost (sprintf "/payment_intents/%s/confirm" id) {| source = src |} ctx
            return! OK "PaymentIntent Confirmed" ctx
        else
            return! CONFLICT (sprintf "Invalid PaymentIntent Status: %s" x.status) ctx }

    let cancel id (reason: string) ctx = async {
        do! apipost (sprintf "/payment_intents/%s/cancel" id) {||} ctx
        // HACK: storing cancellation reason (event type) as `metadata` since the `cancellation_reason`
        // attribute contrains possible values to: "duplicate", "fraudulent", ...
        do! apipost ("/payment_intents/" + id) {| metadata = {| cancellation_reason = reason |} |} ctx
        return! OK (sprintf "PaymentIntent Canceled | Reason: %s" reason) ctx
    }

module Webhook =

    // TODO: HMAC-SHA256 [timestamp].[payload]
    // see  § https://stripe.com/docs/webhooks/signatures#verify-manually
    // also § https://stripe.com/docs/webhooks/best-practices#verify-events
    let private verifyEvent secret ctx = false

    let private (|PayIntId|_|) (x: JObject) =
        let token = x.SelectToken "$.metadata.paymentIntent"
        match token.Type with
        | JTokenType.String -> Some (string token)
        | _ -> None
    
    let private renderOutcome (arg: JObject) ok =
        if ok then "Succeeded" else "Failed"
        |> sprintf "PaymentIntent [%s] %s" (string arg.["id"])
        |> OK

    let private handleEvent (typ, arg) =
        match typ, arg with
        | "source.chargeable", PayIntId x -> PaymentIntent.confirm x (string arg.["id"])
        | ("source.failed" | "source.canceled"), PayIntId x -> PaymentIntent.cancel x typ
        | "payment_intent.succeeded", _ -> renderOutcome arg true
        | "payment_intent.payment_failed", _ -> renderOutcome arg false
        | _ -> NOT_ACCEPTABLE "Invalid event"

    let notifyEvent ctx = async {
        let cfg = Config.get ctx
        match cfg.webhookSecret with
        | Some secret when not (verifyEvent secret ctx) ->
            return! FORBIDDEN "Invalid Signature" ctx
        | _ ->
            let x = jread<{| ``type``: string; data: {| object: JObject |} |}> ctx
            return! handleEvent (x.``type``, x.data.object) ctx }
