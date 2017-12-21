/**
 * config.example.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * Copy this file to `config.js` and enter your personal information.
 */

'use strict';

module.exports = {
  // Default country.
  country: 'US',

  // Store currency.
  // Note: A few payment methods like iDEAL or SOFORT only work with euros,
  // so it's a good common denominator to test both Elements and Sources.
  currency: 'eur',

  // Configuration for Stripe.
  // API Keys: https://dashboard.stripe.com/account/apikeys
  // Webhooks: https://dashboard.stripe.com/account/webhooks
  stripe: {
    // Note: Use your test keys for development. For non-card payments like iDEAL,
    // use your live keys to see redirects to the real banking sites.
    secretKey: 'YOUR_STRIPE_SECRET_KEY',
    publishableKey: 'YOUR_STRIPE_PUBLISHABLE_KEY',
    // Setting the webhook secret here is good practice in order to verify signatures.
    // After setting a webhook, click to reveal details and find your signing secret.
    webhookSecret: null,
  },

  // Server port.
  port: 8000,

  // Tunnel to serve the app over HTTPS and be able to receive webhooks locally.
  // Optionally, if you have a paid ngrok account, you can specify your `subdomain`
  // and `authtoken` to use it.
  ngrok: {
    enabled: true,
    port: 8000,
    subdomain: null,
    authtoken: null,
  },
};
