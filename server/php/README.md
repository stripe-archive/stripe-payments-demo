# Stripe Payments Demo — PHP Server

This demo uses:

- [Slim](http://www.slimframework.com/) as the API framework.
- [stripe-php](https://github.com/stripe/stripe-php) as the SDK to interact with Stripe's APIs
- [monolog/monolog](https://github.com/Seldaek/monolog) as the logging interface

## Payments Integration

- [`settings.php`](settings.php) contains the Stripe account configuration as well as the payment methods accepted in this demo.
- [`index.php`](index.php) contains the routes that interface with Stripe to create PaymentIntents and receive webhook events.
- [`store`](store) contains inventory and shipping utils.

## Requirements

You’ll need the following:

- PHP 5.4 or higher
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay).
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free!)
- The [Stripe CLI](https://github.com/stripe/stripe-cli) for local webhook forwarding.

## Getting Started

After cloning the repository, you first have to install the dependencies using composer:

```
cd server/php
composer install
```

Rename `settings.ini.example` to `settings.ini` and update your [Stripe API keys](https://dashboard.stripe.com/account/apikeys) and any other configuration details you might want to add.

That's it, you can now run the application by using the PHP built-in server still from the `server/php` directory:

```
composer start
```

You should now see it running on [`http://localhost:8888/`](http://localhost:8888/)

Optionally you can change the directory tree to fit your needs, don't forget to:

- change the path to the `public` directory in `settings.php`
- uncomment the `RewriteBase` option in [`.htaccess`](.htaccess) and update the value accordingly if needed

### Testing Webhooks

We can use the Stripe CLI to forward webhook events to our local development server:

- [Install](https://github.com/stripe/stripe-cli#installation) the Stripe CLI.
- Follow the [login steps](https://github.com/stripe/stripe-cli#login) to connect the CLI with your Stripe account.
- Run the [`listen`](https://github.com/stripe/stripe-cli#listen) command to forward the webhooks to localhost:

```
stripe listen --forward-to http://localhost:4567/webhook
```

> **Note:** You do not need to configure any webhook endpoints in your Dashboard to receive webhooks with the CLI.

The Stripe CLI will let you know that webhook forwarding is ready and output your webhook signing secret:

    > Ready! Your webhook signing secret is whsec_xxx

Please copy the webhook signing secret (`whsec_xxx`) to your `settings.ini` file.

## Logging

The application logs webhook events in `server/php/logs`. Make sure your server has write access to that directory.

## Credits

- Code: [Youssef Ben Othman](https://twitter.com/_youbo)
