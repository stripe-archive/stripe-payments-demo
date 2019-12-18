# Stripe Payments Demo — Node Server

This directory contains the main Node implementation of the payments server.

### Requirements

You’ll need the following:

- [Node.js](http://nodejs.org) >=10.0.0
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay).
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free).

In your Stripe Dashboard, you can [enable the payment methods](https://dashboard.stripe.com/payments/settings) you’d like to test.

Some payment methods require receiving a real-time webhook notification to complete a charge. We're using the [Stripe CLI](https://github.com/stripe/stripe-cli#listen) to forward webhook events to our local development server. Additionally this demo is bundled with [ngrok](https://ngrok.com/), to serve the app locally via HTTPS, which is required for the Payment Request API.

### Running the Node Server

Copy the environment variables file from the root of the repository:

    cp .env.example .env

Update `.env` with your own [Stripe API keys](https://dashboard.stripe.com/account/apikeys) and any other configuration details. These environment variables are loaded and used in [`server/node/config.js`](/server/node/config.js), where you can review and edit other options such as the app currency and your Stripe account country.

Install dependencies using npm:

    npm install

This demo uses the Stripe API as a datastore for products and SKUs, but you can always choose to use your own datastore instead. After `npm install` has finished the `setup` script will run to create the product records on your Stripe account.

Next, follow [these installation steps](https://github.com/stripe/stripe-cli#installation) to install the Stripe CLI which we'll use for webhook testing.

After the installation has finished, authenticate the CLI with your Stripe account:

    stripe login  --project-name=stripe-payments-demo

To start the webhook forwarding run:

    stripe listen --project-name=stripe-payments-demo --forward-to http://localhost:8000/webhook

Alternatively, you can use the following shorthand command:

    npm run webhook

The Stripe CLI will let you know that webhook forwarding is ready and output your webhook signing secret:

    > Ready! Your webhook signing secret is whsec_xxx

Please copy the webhook signing secret (`whsec_xxx`) to your `.env` file.

In a separate terminal window, start the local server:

    npm run start

Lastly, you will see the ngrok URL to serve our app via HTTPS. For example:

    https://<example>.ngrok.io

Use this URL in your browser to start the demo.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Credits

- Code: [Romain Huet](https://twitter.com/romainhuet) and [Thorsten Schaeff](https://twitter.com/thorwebdev)
