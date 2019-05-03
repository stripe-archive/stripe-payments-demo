/**
 * setup.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet)
 * and Thorsten Schaeff (@thorwebdev).
 *
 * This is a one-time setup script for your server. It creates a set of fixtures,
 * namely products and SKUs, that are used to create a random basket session.
 */

'use strict';

const config = require('./config');
const stripe = require('stripe')(config.stripe.secretKey);
stripe.setApiVersion(config.stripe.apiVersion);

// Replace this list with information about your store's products.
const products = [
  {
    id: 'increment',
    name: 'Increment Magazine',
    price: 399,
    attributes: {issue: 'Issue #3 “Development”'},
  },
  {
    id: 'shirt',
    name: 'Stripe Shirt',
    price: 999,
    attributes: {size: 'Small Standard', gender: 'Woman'},
  },
  {
    id: 'pins',
    name: 'Stripe Pins',
    price: 799,
    attributes: {set: 'Collector Set'},
  },
];

// Creates a collection of Stripe Products and SKUs to use in your storefront
const createStoreProducts = async () => {
  try {
    const stripeProducts = await Promise.all(
      products.map(async product => {
        const stripeProduct = await stripe.products.create({
          id: product.id,
          name: product.name,
          type: 'good',
          attributes: Object.keys(product.attributes),
          metadata: product.metadata,
        });

        const stripeSku = await stripe.skus.create({
          product: stripeProduct.id,
          price: product.price,
          currency: config.currency,
          attributes: product.attributes,
          inventory: {type: 'infinite'},
        });

        return {stripeProduct, stripeSku};
      })
    );

    console.log(
      `🛍️  Successfully created ${
        stripeProducts.length
      } products on your Stripe account.`
    );
  } catch (error) {
    console.log(`⚠️  Error: ${error.message}`);
    return;
  }
};

createStoreProducts();
