/**
 * orders.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * Simple library to store and interact with orders and products.
 * These methods are using the Stripe Orders API, but we tried to abstract them
 * from the main code if you'd like to use your own order management system instead.
 */

'use strict';

const config = require('../config');
const stripe = require('stripe')(config.stripe.secretKey);
stripe.setApiVersion(config.stripe.apiVersion);

// Create an order.
const createOrder = async (currency, items, email, shipping) => {
  // Create order
  const order = await stripe.orders.create({
    currency,
    items,
    email,
    shipping,
    metadata: {
      status: 'created',
    },
  });
  // Create Payment Intent to represent customers intent to pay this order
  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.amount,
    currency: order.currency,
    metadata: {
      order: order.id,
    },
    allowed_source_types: ['card'],
  });
  // Add payment intent ID and secret to order
  return await updateOrder(order.id, {
    metadata: {
      intent_id: paymentIntent.id,
      intent_secret: paymentIntent.client_secret,
    },
  });
};

// Retrieve an order by ID.
const retrieveOrder = async orderId => {
  return await stripe.orders.retrieve(orderId);
};

// Update an order.
const updateOrder = async (orderId, properties) => {
  return await stripe.orders.update(orderId, properties);
};

// List all products.
const listProducts = async () => {
  return await stripe.products.list({limit: 3});
};

// Retrieve a product by ID.
const retrieveProduct = async productId => {
  return await stripe.products.retrieve(productId);
};

// Validate that products exist.
const checkProducts = productList => {
  const validProducts = ['increment', 'shirt', 'pins'];
  return productList.data.reduce((accumulator, currentValue) => {
    return (
      accumulator &&
      productList.data.length === 3 &&
      validProducts.includes(currentValue.id)
    );
  }, !!productList.data.length);
};

exports.orders = {
  create: createOrder,
  retrieve: retrieveOrder,
  update: updateOrder,
};

exports.products = {
  list: listProducts,
  retrieve: retrieveProduct,
  exist: checkProducts,
};
