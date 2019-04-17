# Stripe Payments Demo - Go Server

This demo uses a simple [Echo](https://echo.labstack.com/) application as the server.

## Payments Integration

- [`app.go`](app.go) contains the routes that interface with Stripe to create charges and receive webhook events.

## Requirements

You’ll need the following:

- [Go 1.11 or later](https://golang.org/doc/install) (for module support)
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay).
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free!)

## Getting Started

Copy the example environment variables file `.env.example` from the root of the repo into your own environment file called `.env`:

```
cp .env.example .env
```

Run the application from this directory (after running `cd server/go`):

```
go run app.go -root-directory=$(realpath ../..)
```

You should now see it running on [`http://localhost:4567/`](http://localhost:4567/)

### Testing Webhooks

If you want to test [receiving webhooks](https://stripe.com/docs/webhooks), we recommend using ngrok to expose your local server.

First [download ngrok](https://ngrok.com) and start your Echo application.

[Run ngrok](https://ngrok.com/docs). Assuming your Echo application is running on the default port 4567, you can simply run ngrok in your Terminal in the directory where you downloaded ngrok:

```
ngrok http 4567
```

ngrok will display a UI in your terminal telling you the new forwarding address for your Echo app. Use this URL as the URL to be called in your developer [webhooks panel.](https://dashboard.stripe.com/account/webhooks)

Don't forget to append `/webhook` when you set up your Stripe webhook URL in the Dashboard. Example URL to be called: `https://75795038.ngrok.io/webhook`.
