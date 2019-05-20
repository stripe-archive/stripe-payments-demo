# Stripe Payments Demo - F# Server

This demo uses a simple [Suave](https://suave.io/) application as the server.

## Payments Integration

- [`app.fs`](app.fs) contains the routes that interface with Stripe to create charges and receive webhook events.

## Requirements

You’ll need the following:

- [.NET Core SDK](https://www.oracle.com/technetwork/java/javase/overview/java8-2100321.html) >= 2.2.202
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay)
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free)

## Getting Started

Set the enviroment variables for the web application. You can copy the environment variables from [here](run.sh)

```
export PORT=
export STRIPE_PUBLISHABLE_KEY=
export STRIPE_SECRET_KEY=
export STRIPE_WEBHOOK_SECRET=
export STRIPE_ACCOUNT_COUNTRY=
export PAYMENT_METHODS=
export STRIPE_CURRENCY=
export STRIPE_API_VERSION=
```

Run the application from this directory (after running `cd server/fsharp`):

```
dotnet run
```

You should now see it running on [`http://localhost:8000/`](http://localhost:8000/)

### Testing Webhooks

If you want to test [receiving webhooks](https://stripe.com/docs/webhooks), we recommend using ngrok to expose your local server.

First [download ngrok](https://ngrok.com) and start your `Suave` application. Assuming it's running on the default port 8000, you can simply execute:

```
ngrok http 8000
```

ngrok will display a UI in your terminal telling you the new forwarding address for your local server. Use this URL in your developer [webhooks panel](https://dashboard.stripe.com/account/webhooks) — don't forget to append `/webhook` when you set up your Stripe webhook URL in the Dashboard. Example URL to be called: `https://75795038.ngrok.io/webhook`.

## Credits

- Code: [Alex Medina](https://twitter.com/lxmedina)
