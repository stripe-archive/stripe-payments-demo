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
    name: 'Increment Magazine',
    price: 399,
    attributes: {issue: 'Issue #3 “Development”'},
    metadata: {img_scr: 'increment'},
  },
  {
    name: 'Stripe Shirt',
    price: 999,
    attributes: {size: 'Small Standard', gender: 'Woman'},
    metadata: {img_scr: 'shirt'},
  },
  {
    name: 'Stripe Pins',
    price: 799,
    attributes: {set: 'Collector Set'},
    metadata: {img_scr: 'pins'},
  },
];

// Creates a collection of Stripe Products and SKUs to use in your storefront
const createStoreProducts = async () => {
  const stripeProducts = await Promise.all(
    products.map(async product => {
      const stripeProduct = await stripe.products.create({
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
};

createStoreProducts();
