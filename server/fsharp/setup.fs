module Demo.Setup

open FSharp.Data

let data = [
    {|  id = "increment"
        name = "Increment Magazine"
        price = 399
        attrs = Map [ "issue", "Issue #3 “Development”" ] |}
    {|  id = "shirt"
        name = "Stripe Shirt"
        price = 999
        attrs = Map [ "size", "Small Standard"
                      "gender", "Woman" ] |}
    {|  id = "pins"
        name = "Stripe Pins"
        price = 799
        attrs = Map [ "set", "Collector Set" ] |} ]

let initCatalog ctx =
    let cfg = Config.get ctx

    let mkprod id name attrs =
        apipost "/products"
            {|  id = id
                name = name
                attributes = attrs |> Map.toSeq |> Seq.map fst
                ``type`` = "good" |} ctx
        |> Async.map (fun (x: {| id: string |}) -> x.id)

    let mksku price attrs pid: Async<unit> =
        apipost "/skus"
            {|  product = pid
                price = price
                attributes = attrs
                currency = cfg.currency
                inventory = {| ``type`` = "infinite"|} |} ctx

    async.For (seq data, fun x ->
        mkprod x.id x.name x.attrs
        |> Async.bind (mksku x.price x.attrs))
