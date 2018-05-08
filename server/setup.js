/**
 * setup.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * This is a one-time setup script for your server. It creates a set of fixtures,
 * namely products and SKUs, that can then used to create orders when completing the
 * checkout flow in the web interface.
 */

'use strict';

const config = require('../config');
const stripe = require('stripe')(config.stripe.secretKey);
stripe.setApiVersion(config.stripe.apiVersion);

module.exports = {
  running: false,
  run: async () => {
    if (this.running) {
      console.log('⚠️  Setup already in progress.');
    } else {
      this.running = true;
      this.promise = new Promise(async resolve => {
        // Create a few products and SKUs assuming they don't already exist.
        try {
          // Increment Magazine.
          const increment = await stripe.products.create({
            id: 'support-on-demand',
            type: 'good',
            name: 'Support On-Demand',
            attributes: ['unit'],
          });
          await stripe.skus.create({
            id: 'support-on-demand-request',
            product: 'support-on-demand',
            attributes: {unit: 'Pay Per Request'},
            price: 18000,
            currency: config.currency,
            inventory: {type: 'infinite'},
          });

          console.log('Setup complete.');
          resolve();
          this.running = false;
        } catch (err) {
          if (err.message === 'Product already exists.') {
            console.log('⚠️  Products have already been registered.');
            console.log('Delete them from your Dashboard to run this setup.');
          } else {
            console.log('⚠️  An error occurred.', err);
          }
        }
      });
    }
    return this.promise;
  },
};
