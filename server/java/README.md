# Stripe Payments Demo - Java Server

This demo uses a simple [Spark](http://sparkjava.com) application as the server.

## Payments Integration

- [`Application.java`](src/main/java/app/Application.java) contains the routes that interface with Stripe to create charges and receive webhook events.

## Requirements

You’ll new the following:

- [Java 8](https://www.oracle.com/technetwork/java/javase/overview/java8-2100321.html)
- [Gradle](https://gradle.org/)
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay)
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free!)
- The [Stripe CLI](https://github.com/stripe/stripe-cli) for local webhook forwarding.

## Getting Started

Before getting started check that you have java installed

```
java -version
```

Set the enviroment variables for the web application. You can copy the environment variables from [here](../../.env.example)

```
export STRIPE_PUBLISHABLE_KEY=
export STRIPE_SECRET_KEY=
export STRIPE_WEBHOOK_SECRET=
export STRIPE_ACCOUNT_COUNTRY=
export PAYMENT_METHODS="alipay, bancontact, card, eps, ideal, giropay, multibanco, sofort, wechat"
export NGROK_SUBDOMAIN=
export NGROK_AUTHTOKEN=
```

Use `gradle` to install the required dependencies by navigating to ./server/java and running:

```
gradle build
```

Use `gradle` to build a "fatjar" including all the apps dependencies.

```
gradle shadowJar
```

This will build a JAR in the `./build/libs` directory. Running this JAR will start the Spark Web Application on port 4567.

```
java -jar build/libs/salesPaymentDemo-1.0-SNAPSHOT.jar
```

You should now see it running on [`http://localhost:4567/`](http://localhost:4567/)

### Testing Webhooks

#### :warning: API Versions

Java is a strictly typed language. As such when deserializing objects using the Stripe Java SDK one should ensure that the API version of their account is
compatible with the API version the Stripe Java SDK you are using. If you are using a new SDK and have an older API Version on your account you may see errors
when trying to deserialize or use deserialized objects.

You can see which version of the Java SDK Matches which API Version [here](https://github.com/stripe/stripe-java/blob/master/src/main/java/com/stripe/Stripe.java#L13)

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

Export the webhook signing secret as an env variable before starting your local development server:

    export STRIPE_WEBHOOK_SECRET=whsec_xxx

## Credits

- Code: [Mike Shaw](https://www.linkedin.com/in/mandshaw/)
