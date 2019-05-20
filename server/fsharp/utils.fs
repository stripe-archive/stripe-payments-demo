[<AutoOpen>]
module Demo.Utils

open Suave
open FSharp.Data
open Newtonsoft.Json
open Newtonsoft.Json.Linq

let formEncode x =
    let rec loop (path: string) (x: JToken) = seq {
        match x.Type with
        | JTokenType.Object ->
            yield! x :?> JObject
                |> Seq.map (loop path)
                |> Seq.concat
        | JTokenType.Array ->
            yield! x :?> JArray
                |> Seq.mapi (fun i x' -> (string i |> mkpath path, x') ||> loop)
                |> Seq.concat
        | JTokenType.Property ->
            let prop = x :?> JProperty
            yield! loop (mkpath path prop.Name) prop.Value
        | _ when (x :? JValue) ->
            yield (path, x :?> JValue |> string)    // TODO: date format? +invariant culture
        | _ -> () }
    and mkpath current key =
        match current with
        | "" -> key
        | _ -> sprintf "%s[%s]" current key
    x |> JToken.FromObject |> loop ""

let apiRequest method path query body ctx =
    let cfg = Config.get ctx
    let hs = ("Authorization", sprintf "Bearer %s" cfg.secretKey)
            :: match cfg.apiVersion with
                | Some version -> [("Stripe-Version", version)]
                | None -> []
    Http.AsyncRequest (
        httpMethod = method,
        url = sprintf "https://api.stripe.com/v1%s" path,
        query = query,
        ?body = Option.map (formEncode >> FormValues) body,
        headers = hs,
        silentHttpErrors = true,
        responseEncodingOverride = "utf-8"
    )

let setHeader key value headers =
    (key, value)
    ::
    (headers |> List.filter (fst >> String.equalsCaseInsensitive key >> not))

let pipeResponse (resp: HttpResponse) ctx =
    let (payload, defaultType) =
        match resp.Body with
        | Binary bs -> (bs, "application/octet-stream")
        | Text str -> (UTF8.bytes str, "text/plain; charset=utf-8")
    let contentType = resp.Headers |> Map.tryFind "Content-Type" |> Option.defaultValue defaultType
    let contentLocation =  (System.Uri resp.ResponseUrl).PathAndQuery
    succeed {
        ctx with response = {
                ctx.response with
                                status = { code = resp.StatusCode; reason = "" };
                                content = Bytes payload;
                                headers = ctx.response.headers
                                            |> setHeader "Content-Type" contentType
                                            |> setHeader "Content-Location" contentLocation }}

let pipeApiGet path query ctx = async {
    let! resp = apiRequest "GET" path query None ctx
    return! pipeResponse resp ctx
}

let pipeApiPost path body ctx = async {
    let! resp = apiRequest "POST" path [] (Some body) ctx
    return! pipeResponse resp ctx
}

let inline tojson<'a> (x: 'a) = JsonConvert.SerializeObject x

let inline jparse<'a> x = JsonConvert.DeserializeObject<'a> x

let jread<'a> ctx = ctx.request.rawForm |> UTF8.toString |> jparse<'a>

let jwrite (code: Suave.Http.HttpCode) x ctx =
    let payload = x |> tojson |> UTF8.bytes
    succeed {
      ctx with
        response = { ctx.response with
                        status = code.status
                        content = Bytes payload
                        headers = ctx.response.headers
                                |> setHeader "Content-Type" "application/json; charset=utf-8" } }

let apicall method path query body ctx =
    apiRequest method path query body ctx
    |> Async.map (function
        | { StatusCode = 200; Body = Text result } -> jparse result
        | err -> failwithf "Request %s %s (query: %A) (body: %A) failed (response: %A)"
                    method path query body err)

let inline apiget<'a> path query ctx: Async<'a> = apicall "GET" path query None ctx

// NOTE: no explicit type parameter <'a> since it'd affect type inference (body: obj)
// see https://fsharp.org/specs/language-spec/4.1/FSharpSpec-4.1-latest.pdf
// § 14.6.7 — Generalization
//     >> Explicit type parameter definitions on value and member definitions can affect the process of type
//     >> inference and generalization. In particular, a declaration that includes explicit generic parameters
//     >> will not be generalized beyond those generic parameters.
//     >> To permit generalization at these definitions, either remove the explicit generic parameters (if they
//     >> can be inferred), or use the required number of parameters
let inline apipost path body ctx = apicall "POST" path [] (Some body) ctx
