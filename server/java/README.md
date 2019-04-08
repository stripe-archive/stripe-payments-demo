# Stripe Payments Demo - Java Server

This demo uses a simple [Spark](http://sparkjava.com) application as the server.

## Payments Integration

- [`Application.java`](src/main/java/app/Application.java) contains the routes that interface with Stripe to create charges and receive webhook events.

## Requirements

You’ll new the following:

- [Java 8](https://www.oracle.com/technetwork/java/javase/overview/java8-2100321.html)
- [Gradle](https://gradle.org/)
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay).
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free!)

## Getting Started

Before getting started check that you have java installed

```
java -version
```

Set the enviroment variables for the web application. You can copy the environment variables from [here](../../.env/example)

```
export STRIPE_PUBLISHABLE_KEY=
export STRIPE_SECRET_KEY=
export STRIPE_WEBHOOK_SECRET=
export STRIPE_ACCOUNT_COUNTRY=
export PAYMENT_METHODS=
export NGROK_SUBDOMAIN=
export NGROK_AUTHTOKEN=
```

Use `gradle` to install the required dependencies by navigating to ./server/java and running:

```
gradle build
```

Use `gradle` to build a "fatjar" including all the apps dependencies.

```
java -jar build/libs/salesPaymentDemo-1.0-SNAPSHOT.jar
```

You should now see it running on [`http://localhost:4567/`](http://localhost:4567/)

### Testing Webhooks

If you want to test [receiving webhooks](https://stripe.com/docs/webhooks), we recommend using ngrok to expose your local server.

First [download ngrok](https://ngrok.com) and start your Spark application.

[Run ngrok](https://ngrok.com/docs). Assuming your Spark application is running on the default port 4567, you can simply run ngrok in your Terminal in the directory where you downloaded ngrok:

```
ngrok http 4567
```

ngrok will display a UI in your terminal telling you the new forwarding address for your Spark app. Use this URL as the URL to be called in your developer [webhooks panel.](https://dashboard.stripe.com/account/webhooks)

Don't forget to append `/webhook` when you set up your Stripe webhook URL in the Dashboard. Example URL to be called: `https://75795038.ngrok.io/webhook`.

## Credits
- Code: [Mike Shaw](https://www.linkedin.com/in/mandshaw/)