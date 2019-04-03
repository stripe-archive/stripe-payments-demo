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

If you want to test [receiving webhooks](https://stripe.com/docs/webhooks), we recommend using ngrok to expose your local server.

First [download ngrok](https://ngrok.com) and start your Sinatra application.

[Run ngrok](https://ngrok.com/docs). Assuming your Sinatra application is running on the default port 4567, you can simply run ngrok in your Terminal in the directory where you downloaded ngrok:

```
ngrok http 4567
```

ngrok will display a UI in your terminal telling you the new forwarding address for your Sinatra app. Use this URL as the URL to be called in your developer [webhooks panel.](https://dashboard.stripe.com/account/webhooks)

Don't forget to append `/webhook` when you set up your Stripe webhook URL in the Dashboard. Example URL to be called: `https://75795038.ngrok.io/webhook`.

## Credits
- Code: [Mike Shaw](https://www.linkedin.com/in/mandshaw/)