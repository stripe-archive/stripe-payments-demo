/**
 * routes.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet)
 * and Thorsten Schaeff (@thorwebdev).
 *
 * This file defines all the endpoints for this demo app. The two most interesting
 * endpoints for a Stripe integration are marked as such at the beginning of the file.
 * It's all you need in your app to accept all payments in your app.
 */

'use strict';

const config = require('./config');
const setup = require('./setup');
const {products} = require('./inventory');
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(config.stripe.secretKey);
stripe.setApiVersion(config.stripe.apiVersion);

// Render the main app HTML.
router.get('/', (req, res) => {
  res.render('index.html');
});

/**
 * Stripe integration to accept all types of payments with 3 POST endpoints.
 *
 * 1. POST endpoint to create a PaymentIntent.
 * 2. For payments using Elements, Payment Request, Apple Pay, Google Pay, Microsoft Pay
 * the PaymentIntent is confirmed automatically with Stripe.js on the client-side.
 * 3. POST endpoint to be set as a webhook endpoint on your Stripe account.
 * It confirms the PaymentIntent as soon as a non-card payment source becomes chargeable.
 */

// Calculate total payment amount based on items in basket.
const calculatePaymentAmount = async items => {
  const productList = await products.list();
  const skus = productList.data.reduce((a, c) => [...a, ...c.skus.data], []);
  const total = items.reduce((a, c) => {
    const sku = skus.filter(sku => sku.id === c.parent)[0];
    return a + sku.price * c.quantity;
  }, 0);
  return total;
};

// Create the PaymentIntent on the backend.
router.post('/payment_intents', async (req, res, next) => {
  let {currency, items} = req.body;
  const amount = await calculatePaymentAmount(items);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: [
        // 'ach_credit_transfer', // throws: error: "Invalid currency: eur. The payment method `ach_credit_transfer` only supports the following currencies: usd."
        'alipay',
        'bancontact',
        'card',
        'eps',
        'ideal',
        'giropay',
        'multibanco',
        'sepa_debit',
        'sofort',
        'wechat',
      ], // TODO config & gating
    });
    return res.status(200).json({paymentIntent});
  } catch (err) {
    return res.status(500).json({error: err.message});
  }
});

// Update PaymentIntent with shipping cost.
router.post('/payment_intents/:id/shipping_change', async (req, res, next) => {
  const {items, shippingOption} = req.body;
  let amount = await calculatePaymentAmount(items);
  amount += products.getShippingCost(shippingOption.id);

  try {
    const paymentIntent = await stripe.paymentIntents.update(req.params.id, {
      amount,
    });
    return res.status(200).json({paymentIntent});
  } catch (err) {
    return res.status(500).json({error: err.message});
  }
});

// Webhook handler to process payments for sources asynchronously.
router.post('/webhook', async (req, res) => {
  let data;
  let eventType;
  // Check if webhook signing is configured.
  if (config.stripe.webhookSecret) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        config.stripe.webhookSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }
  const object = data.object;

  // PaymentIntent Beta, see https://stripe.com/docs/payments/payment-intents
  // Monitor payment_intent.succeeded & payment_intent.payment_failed events.
  if (object.object === 'payment_intent') {
    const paymentIntent = object;
    if (eventType === 'payment_intent.succeeded') {
      console.log(
        `🔔  Webhook received! Payment for PaymentIntent ${
          paymentIntent.id
        } succeeded.`
      );
    } else if (eventType === 'payment_intent.payment_failed') {
      console.log(
        `🔔  Webhook received! Payment on source ${
          paymentIntent.last_payment_error.source.id
        } for PaymentIntent ${paymentIntent.id} failed.`
      );
      // Note: you can use the existing PaymentIntent to prompt your customer to try again by attaching a newly created source:
      // https://stripe.com/docs/payments/payment-intents#lifecycle
    }
  }

  // Monitor `source.chargeable` events.
  if (
    object.object === 'source' &&
    object.status === 'chargeable' &&
    object.metadata.paymentIntent
  ) {
    const source = object;
    console.log(`🔔  Webhook received! The source ${source.id} is chargeable.`);
    // Find the corresponding PaymentIntent this source is for by looking in its metadata.
    const paymentIntent = await stripe.paymentIntents.retrieve(
      source.metadata.paymentIntent
    );
    // Check whether this PaymentIntent requires a source.
    if (paymentIntent.status != 'requires_payment_method') {
      return res.sendStatus(403);
    }
    // Confirm the PaymentIntent with the chargeable source.
    await stripe.paymentIntents.confirm(paymentIntent.id, {source: source.id});
  }

  // TODO Monitor `source.failed`, `source.canceled`, and `PI.?` events.

  // Return a 200 success code to Stripe.
  res.sendStatus(200);
});

/**
 * Routes exposing the config as well as the ability to retrieve products.
 */

// Expose the Stripe publishable key and other pieces of config via an endpoint.
router.get('/config', (req, res) => {
  res.json({
    stripePublishableKey: config.stripe.publishableKey,
    stripeCountry: config.stripe.country,
    country: config.country,
    currency: config.currency,
  });
});

// Retrieve all products.
router.get('/products', async (req, res) => {
  const productList = await products.list();
  // Check if products exist on Stripe Account.
  if (products.exist(productList)) {
    res.json(productList);
  } else {
    // We need to set up the products.
    await setup.run();
    res.json(await products.list());
  }
});

// Retrieve a product by ID.
router.get('/products/:id', async (req, res) => {
  res.json(await products.retrieve(req.params.id));
});

// Retrieve the PaymentIntent status.
router.get('/payment_intents/:id/status', async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
  res.json({paymentIntent: {status: paymentIntent.status}});
});

module.exports = router;
