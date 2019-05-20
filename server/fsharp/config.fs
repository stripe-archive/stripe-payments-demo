namespace Demo

open FsConfig
open Suave

type Config = {
    [<DefaultValue "8000">]
    port: int
    [<CustomName "STRIPE_PUBLISHABLE_KEY">]
    publicKey: string
    [<CustomName "STRIPE_SECRET_KEY">]
    secretKey: string
    [<CustomName "STRIPE_WEBHOOK_SECRET">]
    webhookSecret: string option
    [<CustomName "STRIPE_ACCOUNT_COUNTRY">] [<DefaultValue "US">]
    accountCountry: string
    [<CustomName "STRIPE_PAYMENT_METHODS">] [<DefaultValue "">]
    paymentMethods: string list
    [<CustomName "STRIPE_CURRENCY">] [<DefaultValue "eur">]
    currency: string
    [<CustomName "STRIPE_API_VERSION">] [<DefaultValue "">]
    apiVersion: string option
}

type ShippingOption = {
    id: string
    label: string
    detail: string
    amount: int
}

type ClientConfig = {
    stripePublishableKey: string
    stripeCountry: string
    country: string
    currency: string
    paymentMethods: string list
    shippingOptions: ShippingOption list
}

module Config =

    let private PaymentMethods = [
        // "ach_credit_transfer"    // usd (ACH Credit Transfer payments must be in U.S. Dollars)
        "alipay"                    // aud, cad, eur, gbp, hkd, jpy, nzd, sgd, or usd.
        "bancontact"                // eur (Bancontact must always use Euros)
        "card"                      // many (https://stripe.com/docs/currencies#presentment-currencies)
        "eps"                       // eur (EPS must always use Euros)
        "ideal"                     // eur (iDEAL must always use Euros)
        "giropay"                   // eur (Giropay must always use Euros)
        "multibanco"                // eur (Multibanco must always use Euros)
        // "sepa_debit"             // Restricted. See docs for activation details: https://stripe.com/docs/sources/sepa-debit
        "sofort"                    // eur (SOFORT must always use Euros)
        "wechat"                    // aud, cad, eur, gbp, hkd, jpy, sgd, or usd.
    ]

    let load () =
        match EnvConfig.Get<Config> () with
        | Ok x ->
            if x.paymentMethods.Length = 0
                then { x with paymentMethods = PaymentMethods }
                else x
            |> Ok
        | Error x ->
            match x with
            | NotFound var -> sprintf "Environment variable %s not found" var
            | BadValue (var, value) -> sprintf "Invalid value (%s) for variable %s" value var
            | NotSupported msg -> msg
            |> Error

    let [<Literal>] private ConfigKey = "CONFIG";

    let get ctx =
        ctx.userState
        |> Map.tryFind ConfigKey
        |> Option.map (fun x -> x :?> Config)
        |> Option.get

    let set (config: Config) = Writers.setUserData ConfigKey config

    let client ctx =
        let cfg = get ctx
        {
            stripePublishableKey = cfg.publicKey
            stripeCountry = cfg.accountCountry
            paymentMethods = cfg.paymentMethods
            currency = cfg.currency
            // TODO: read from request??
            country = "US"
            shippingOptions = [
                {   id = "free"
                    label = "Free Shipping"
                    detail = "Delivery within 5 days"
                    amount = 0 }
                {   id = "express"
                    label = "Express Shipping"
                    detail = "Next day delivery"
                    amount = 500 }
            ]
        }
