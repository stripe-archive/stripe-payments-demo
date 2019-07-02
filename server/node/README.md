# Stripe Payments Demo — Node Server

This directory contains the main Node implementation of the payments server.

## Requirements

You’ll need the following:

- [Node.js](http://nodejs.org) >= 10.x.
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay).
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free).

In your Stripe Dashboard, you can [enable the payment methods](https://dashboard.stripe.com/payments/settings) you’d like to test with one click.

Some payment methods require receiving a real-time webhook notification to complete a charge. This demo is bundled with [ngrok](https://ngrok.com/), which allows us to securely receive webhooks and serve the app locally via HTTPS, which is also required to complete transactions in the browser with Elements or the Payment Request API.

## Getting Started

Copy the environment variables file from the root of the repository:

    cp .env.example .env

Update `.env` with your own [Stripe API keys](https://dashboard.stripe.com/account/apikeys) and any other configuration details. These environment variables are loaded and used in [`server/node/config.js`](/server/node/config.js), where you can review and edit other options such as the app currency and your Stripe account country.

Install dependencies using npm:

    npm install

This demo uses the Stripe API as a datastore for products and SKUs, but you can always choose to use your own datastore instead. When starting the app for the first time, the initial loading can take a couple of seconds as it will automatically set up the products and SKUs within Stripe.

Run the app:

    npm run start

Two public ngrok URLs will be provided when the app starts. The first URL should be used to [setup webhooks](https://dashboard.stripe.com/account/webhooks) in your Stripe Dashboard. For example:

    https://<example>.ngrok.io/webhook

The second URL will serve our app via HTTPS. For example:

    https://<example>.ngrok.io

Use this second URL in your browser to start the demo.

**Don’t want to use ngrok?** As long as you serve the app over HTTPS and that Stripe can reach the webhook endpoint via a public URL, all the payment flows will work.

**Want to test a hosted version of this app with your own Stripe account?** You can deploy an instance of this app on Heroku and set up your own API keys:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Credits

- Code: [Romain Huet](https://twitter.com/romainhuet) and [Thorsten Schaeff](https://twitter.com/schaeff_t)
