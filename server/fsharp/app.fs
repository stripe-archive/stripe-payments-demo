module Demo.Server

open Suave
open Suave.Operators
open Suave.Filters
open Suave.RequestErrors
open Demo.Stripe

let app cfg = 
    choose [
        GET >=> path "/" >=> Files.browseFileHome "index.html"
        GET >=> Files.browseHome
        Config.set cfg >=> choose [
            GET  >=> pathCi     "/config" >=>                           Stripe.clientConfig
            GET  >=> pathCi     "/products" >=>                         Catalog.listProducts true
            GET  >=> pathScanCi "/products/%s/skus"                     Catalog.getSkus
            GET  >=> pathScanCi "/products/%s"                          Catalog.getProduct
            POST >=> pathCi     "/payment_intents" >=>                  PaymentIntent.create
            GET  >=> pathScanCi "/payment_intents/%s/status"            PaymentIntent.getStatus
            POST >=> pathScanCi "/payment_intents/%s/shipping_change"   PaymentIntent.update
            POST >=> pathCi     "/webhook" >=>                          Webhook.notifyEvent
        ]
        NOT_FOUND "" ]


[<EntryPoint>]
let main argv =
    match Config.load () with
    | Ok config ->
        let srvcfg = {
            defaultConfig with
                bindings = [ HttpBinding.createSimple HTTP "0.0.0.0" config.port ]
                homeFolder = System.AppContext.BaseDirectory |> Some }
        app config |> startWebServer srvcfg
        0
    | Error msg ->
        printfn "%s" msg
        -1
