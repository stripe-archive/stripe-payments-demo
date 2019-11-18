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
            id: 'get-together',
            type: 'good',
            name: 'Get Together',
            attributes: ['issue'],
          });
          await stripe.skus.create({
            id: 'get-together-hardcover',
            product: 'get-together',
            attributes: {issue: 'Hardcover — Richardson, Huynh, Sotto'},
            price: 3400,
            currency: config.currency,
            inventory: {type: 'infinite'},
          });

          // The Dream Machine.
          await stripe.products.create({
            id: 'elegant-puzzle',
            type: 'good',
            name: 'An Elegant Puzzle',
            attributes: ['issue'],
          });
          await stripe.skus.create({
            id: 'elegant-puzzle-hardcover',
            product: 'elegant-puzzle',
            attributes: {issue: 'Hardcover — Will Larson'},
            price: 3200,
            currency: config.currency,
            inventory: {type: 'infinite'},
          });

          // Stubborn Attachments.
          await stripe.products.create({
            id: 'revolt_public',
            type: 'good',
            name: 'The Revolt of the Public',
            attributes: ['issue'],
          });
          await stripe.skus.create({
            id: 'revolt_public-hardcover',
            product: 'revolt_public',
            attributes: {issue: 'Hardcover — Martin Gurri'},
            price: 2900,
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
