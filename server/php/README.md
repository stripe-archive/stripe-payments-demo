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

If you want to test [receiving webhooks](https://stripe.com/docs/webhooks), we recommend using ngrok to expose your local server.

First [download ngrok](https://ngrok.com) and start your PHP application.

[Run ngrok](https://ngrok.com/docs). Assuming your PHP application is running on the port 8888, you can simply run ngrok in your Terminal in the directory where you downloaded ngrok:

```
ngrok http 8888
```

ngrok will display a UI in your terminal telling you the new forwarding address for your PHP app. Use this URL as the URL to be called in your developer [webhooks panel.](https://dashboard.stripe.com/account/webhooks)

Don't forget to append `/webhook` when you set up your Stripe webhook URL in the Dashboard. Example URL to be called: `https://75795038.ngrok.io/webhook`.

## Logging

The application logs webhook events in `server/php/logs`. Make sure your server has write access to that directory.

## Credits

- Code: [Youssef Ben Othman](https://twitter.com/_youbo)
