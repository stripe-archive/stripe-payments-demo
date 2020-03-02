# Stripe Payments Demo - Ruby Server

This demo uses a simple [Sinatra](http://sinatrarb.com/) application as the server.

## Payments Integration

- [`app.rb`](app.rb) contains the routes that interface with Stripe to create charges and receive webhook events.
- [`setup.rb`](setup.rb) a simple setup script to make some fake Products and SKUs for our Stripe store.
- [`inventory.rb`](inventory.rb) a minimal wrapper over the Stripe Python SDK that handles creating/fetching products and caluclating payment amounts from SKUs. You can override this class with your own product and order management system code.

## Requirements

You’ll new the following:

- [Ruby 2.X](https://www.ruby-lang.org/en/downloads/)
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay).
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free!)

## Getting Started

Before getting started check that you have ruby installed

```
ruby --version
```

Copy the example environment variables file `.env.example` from the root of the repo into your own environment file called `.env`:

```
cp .env.example .env
```

User `bundler` to install the required gems by navigating to ./server/ruby and running:

```
bundle install
```

Run the Sinatra application

```
bundle exec ruby app.rb
```

You should now see it running on [`http://localhost:4567/`](http://localhost:4567/)

### Testing Webhooks

We can use the Stripe CLI to forward webhook events to our local development server:

- [Install](https://github.com/stripe/stripe-cli#installation) the Stripe CLI.
- Follow the [login steps](https://github.com/stripe/stripe-cli#login) to connect the CLI with your Stripe account.
- Run the [`listen`](https://github.com/stripe/stripe-cli#listen) command to forward the webhooks to localhost:

```
stripe listen --forward-to http://localhost:4567/webhook
```

> **Note:** You do not need to configure any webhook endpoints in your Dashboard to receive webhooks with the CLI.

The Stripe CLI will let you know that webhook forwarding is ready and output your webhook signing secret:

    > Ready! Your webhook signing secret is whsec_xxx

Please copy the webhook signing secret (`whsec_xxx`) to your `.env` file.

## Credits

- Code: [Mike Shaw](https://www.linkedin.com/in/mandshaw/)
