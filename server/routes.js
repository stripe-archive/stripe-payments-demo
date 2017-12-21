/**
 * routes.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * This file defines all the endpoints for this demo app. The two most interesting
 * endpoints for a Stripe integration are marked as such at the beginning of the file.
 * It's all you need in your app to accept all payments in your app.
 */

'use strict';

const config = require('../config');
const {orders, products} = require('./orders');
const stripe = require('stripe')(config.stripe.secretKey);
const express = require('express');
const router = express.Router();

// Render the main app HTML.
router.get('/', (req, res) => {
  res.render('index.html');
});

/**
 * Stripe integration to accept all types of payments with 3 POST endpoints:
 *
 * 1. POST endpoint to create orders with all user information.
 *
 * 2. POST endpoint to complete a payment immediately when a card is used.
 * For payments using Elements, Payment Request, Apple Pay, or Pay with Google.
 *
 * 3. POST endpoint to be set as a webhook endpoint on your Stripe account.
 * It creates a charge as soon as a non-card payment source becomes chargeable.
 */

// Create an order on the backend.
router.post('/orders', async (req, res, next) => {
  let {currency, items, email, shipping} = req.body;
  try {
    let order = await orders.create(currency, items, email, shipping);
    return res.status(200).json({order});
  } catch (err) {
    return res.status(500).json({error: err.message});
  }
});

// Complete payment for an order using a source.
router.post('/orders/:id/pay', async (req, res, next) => {
  let {source} = req.body;
  try {
    // Retrieve the order associated to the ID.
    let order = await orders.retrieve(req.params.id);
    // Verify that this order actually needs to be paid.
    if (
      order.metadata.status === 'pending' ||
      order.metadata.status === 'paid'
    ) {
      return res.status(403).json({order, source});
    }
    // Dynamically evaluate if 3D Secure should be used.
    if (source && source.type === 'card') {
      // A 3D Secure source may be created referencing the card source.
      source = await dynamic3DS(source, order, req);
    }
    // Demo: In test mode, replace the source with a test token so charges can work.
    if (!source.livemode) {
      source.id = 'tok_visa';
    }
    // Pay the order using the Stripe source.
    if (source && source.status === 'chargeable') {
      let charge, status;
      try {
        charge = await stripe.charges.create(
          {
            source: source.id,
            amount: order.amount,
            currency: order.currency,
            receipt_email: order.email,
          },
          {
            // Set a unique idempotency key based on the order ID.
            // This is to avoid any race conditions with your webhook handler.
            idempotency_key: order.id,
          }
        );
      } catch (err) {
        // This is where you handle declines and errors.
        // For the demo we simply set to failed.
        status = 'failed';
      }
      if (charge && charge.status === 'succeeded') {
        status = 'paid';
      } else if (charge) {
        status = charge.status;
      } else {
        status = 'failed';
      }
      // Update the order with the charge status.
      order = await orders.update(order.id, {metadata: {status}});
    }
    return res.status(200).json({order, source});
  } catch (err) {
    return res.status(500).json({error: err.message});
  }
});

// Webhook handler to process payments for sources asynchronously.
router.post('/webhook', async (req, res) => {
  let data;
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
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
  }
  const object = data.object;

  // Monitor `source.chargeable` events.
  if (
    object.object === 'source' &&
    object.status === 'chargeable' &&
    object.metadata.order
  ) {
    const source = object;
    console.log(`🔔  Webhook received! The source ${source.id} is chargeable.`);
    // Find the corresponding order this source is for by looking in its metadata.
    const order = await orders.retrieve(source.metadata.order);
    // Verify that this order actually needs to be paid.
    if (
      order.metadata.status === 'pending' ||
      order.metadata.status === 'paid' ||
      order.metadata.status === 'failed'
    ) {
      return res.sendStatus(403);
    }

    // Note: We're setting an idempotency key below on the charge creation to
    // prevent any race conditions. It's set to the order ID, which protects us from
    // 2 different sources becoming `chargeable` simultaneously for the same order ID.
    // Depending on your use cases and your idempotency keys, you might need an extra
    // lock surrounding your webhook code to prevent other race conditions.
    // Read more on Stripe's best practices here for asynchronous charge creation:
    // https://stripe.com/docs/sources/best-practices#charge-creation

    // Pay the order using the source we just received.
    let charge, status;
    try {
      charge = await stripe.charges.create(
        {
          source: source.id,
          amount: order.amount,
          currency: order.currency,
          receipt_email: order.email,
        },
        {
          // Set a unique idempotency key based on the order ID.
          // This is to avoid any race conditions with your webhook handler.
          idempotency_key: order.id,
        }
      );
    } catch (err) {
      // This is where you handle declines and errors.
      // For the demo, we simply set the status to mark the order as failed.
      status = 'failed';
    }
    if (charge && charge.status === 'succeeded') {
      status = 'paid';
    } else if (charge) {
      status = charge.status;
    } else {
      status = 'failed';
    }
    // Update the order status based on the charge status.
    await orders.update(order.id, {metadata: {status}});
  }

  // Monitor `charge.succeeded` events.
  if (
    object.object === 'charge' &&
    object.status === 'succeeded' &&
    object.source.metadata.order
  ) {
    const charge = object;
    console.log(`🔔  Webhook received! The charge ${charge.id} succeeded.`);
    // Find the corresponding order this source is for by looking in its metadata.
    const order = await orders.retrieve(charge.source.metadata.order);
    // Update the order status to mark it as paid.
    await orders.update(order.id, {metadata: {status: 'paid'}});
  }

  // Monitor `source.failed`, `source.canceled`, and `charge.failed` events.
  if (
    (object.object === 'source' || object.object === 'charge') &&
    (object.status === 'failed' || object.status === 'canceled')
  ) {
    const source = object.source ? object.source : object;
    console.log(`🔔  Webhook received! Failure for ${object.id}.`);
    if (source.metadata.order) {
      // Find the corresponding order this source is for by looking in its metadata.
      const order = await orders.retrieve(source.metadata.order);
      // Update the order status to mark it as failed.
      await orders.update(order.id, {metadata: {status: 'failed'}});
    }
  }

  // Return a 200 success code to Stripe.
  res.sendStatus(200);
});

// Dynamically create a 3D Secure source.
const dynamic3DS = async (source, order, req) => {
  // Check if 3D Secure is required, or trigger it based on a custom rule (in this case, if the amount is above a threshold).
  if (source.card.three_d_secure === 'required' || order.amount > 5000) {
    source = await stripe.sources.create({
      amount: order.amount,
      currency: order.currency,
      type: 'three_d_secure',
      three_d_secure: {
        card: source.id,
      },
      metadata: {
        order: order.id,
      },
      redirect: {
        return_url: req.headers.origin,
      },
    });
  }
  return source;
};

/**
 * Routes exposing the config as well as the ability to retrieve products and orders.
 */

// Expose the Stripe publishable key and other pieces of config via an endpoint.
router.get('/config', (req, res) => {
  res.json({
    stripePublishableKey: config.stripe.publishableKey,
    country: config.country,
    currency: config.currency,
  });
});

// Retrieve an order.
router.get('/orders/:id', async (req, res) => {
  try {
    return res.status(200).json(await orders.retrieve(req.params.id));
  } catch (err) {
    return res.sendStatus(404);
  }
});

// Retrieve all products.
router.get('/products', async (req, res) => {
  res.json(await products.list());
});

// Retrieve a product by ID.
router.get('/products/:id', async (req, res) => {
  res.json(await products.retrieve(req.params.id));
});

module.exports = router;
