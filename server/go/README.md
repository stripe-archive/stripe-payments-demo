# Stripe Payments Demo - Go Server

This demo uses a simple [Echo](https://echo.labstack.com/) application as the server.

## Payments Integration

- [`app.go`](app.go) contains the routes that interface with Stripe to create charges and receive webhook events.

## Requirements

You’ll need the following:

- [Go 1.11 or later](https://golang.org/doc/install) (for module support)
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay)
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free!)
- The [Stripe CLI](https://github.com/stripe/stripe-cli) for local webhook forwarding.

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

We can use the Stripe CLI to forward webhook events to our local development server:

- [Install](https://github.com/stripe/stripe-cli#installation) the Stripe CLI.
- Follow the [login steps](https://github.com/stripe/stripe-cli#login) to connect the CLI with your Stripe account.
- Run the [`listen`](https://github.com/stripe/stripe-cli#listen) command to forward the webhooks to loalhost:

```
stripe listen --forward-to http://localhost:4567/webhook
```
> **Note:** You do not need to configure any webhook endpoints in your Dashboard to receive webhooks with the CLI.

The Stripe CLI will let you know that webhook forwarding is ready and output your webhook signing secret:

    > Ready! Your webhook signing secret is whsec_xxx

Please copy the webhook signing secret (`whsec_xxx`) to your `.env` file.