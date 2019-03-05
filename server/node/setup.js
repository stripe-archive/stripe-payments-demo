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
          // Highgrowth Handbook.
          await stripe.products.create({
            id: 'highgrowth',
            type: 'good',
            name: 'High Growth Handbook',
            attributes: ['issue'],
          });
          await stripe.skus.create({
            id: 'highgrowth-hardcover',
            product: 'highgrowth',
            attributes: {issue: 'Hardcover — Elad Gil'},
            price: 1249,
            currency: config.currency,
            inventory: {type: 'infinite'},
          });

          // The Dream Machine.
          await stripe.products.create({
            id: 'dreammachine',
            type: 'good',
            name: 'The Dream Machine',
            attributes: ['issue'],
          });
          await stripe.skus.create({
            id: 'dreammachine-hardcover',
            product: 'dreammachine',
            attributes: {issue: 'Hardcover — Mitchell Waldrop'},
            price: 1099,
            currency: config.currency,
            inventory: {type: 'infinite'},
          });

          // Stubborn Attachments.
          await stripe.products.create({
            id: 'stubborn',
            type: 'good',
            name: 'Stubborn Attachments',
            attributes: ['issue'],
          });
          await stripe.skus.create({
            id: 'stubborn-hardcover',
            product: 'stubborn',
            attributes: {issue: 'Hardcover — Tyler Cowen'},
            price: 749,
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
