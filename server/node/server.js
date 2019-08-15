/**
 * server.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet)
 * and Thorsten Schaeff (@thorwebdev).
 *
 * This is the main file starting the Express server for the demo and enabling ngrok.
 */

'use strict';

const config = require('./config');
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const ngrok = config.ngrok.enabled ? require('ngrok') : null;
const app = express();

// Setup useful middleware.
app.use(
  bodyParser.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function(req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '../../public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// Define routes.
app.use('/', require('./routes'));

// Start the server on the correct port.
const server = app.listen(config.port, () => {
  console.log(`🚀  Server listening on port ${server.address().port}`);
});

// Turn on the ngrok tunnel in development, which provides both the mandatory HTTPS
// support for all card payments, and the ability to consume webhooks locally.
if (ngrok) {
  ngrok
    .connect({
      addr: config.ngrok.port,
      subdomain: config.ngrok.subdomain,
      authtoken: config.ngrok.authtoken,
    })
    .then(url => {
      console.log(`💳  App URL to see the demo in your browser: ${url}/`);
    })
    .catch(err => {
      if (err.code === 'ECONNREFUSED') {
        console.log(`⚠️  Connection refused at ${err.address}:${err.port}`);
      } else {
        console.log(`⚠️  ${err}`);
      }
      process.exit(1);
    });
}
