# Stripe Payments Demo — Python Server

This demo uses a simple [Flask](http://flask.pocoo.org/) application as the server.

## Payments Integration

- [`app.py`](app.py) contains the routes that interface with Stripe to create PaymentIntents and receive webhook events.
- [`setup.py`](setup.py) a simple setup script to make some fake Products and SKUs for our Stripe store.
- [`tests/tests.py`](tests/tests.py) some unit tests that test the logic of our heavier APIs like `/webhook`.
- [`test_data.py`](tests/tests.py) contains some hardcoded mocked responses to test with.
- [`inventory.py`](stripe_lib.py) a minimal wrapper over the Stripe Python SDK that handles creating/fetching products and caluclating payment amounts. You can override this class with your own product and order management system code.

## Requirements

You’ll need the following:

- [Python 3.6.5](https://www.python.org/downloads/release/python-365/)
- Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay).
- Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free!)

## Getting Started

Before getting started, check to see that you have the right version of Python installed (3.6.5).

```
python3 --version
```

_If your machine is running Python 2 as the default then you can follow these great guides on installing Python 3 for [macOS](http://docs.python-guide.org/en/latest/starting/install3/osx/), [Windows](http://docs.python-guide.org/en/latest/starting/install3/win/), or [Linux](http://docs.python-guide.org/en/latest/starting/install3/linux/)._

Once you have Homebrew and Python 3 set up, copy the example environment variables file `.env.example` from the root of the repo into your own environment file called `.env`:

```
cp .env.example .env
```

Update your `.env` file with your own [Stripe API keys](https://dashboard.stripe.com/account/apikeys) and any other configuration details you might want to add. The env variables are managed via the [python-dotenv](https://github.com/theskumar/python-dotenv) package.

Create a [virtual environment](https://docs.python.org/3/tutorial/venv.html) to manage the packages and state our application needs:

```
cd server/python
python3 -m venv env
source env/bin/activate
```

Run `pip install` to fetch the Python packages we use:

```
pip install -r requirements.txt
```

Export our Flask app and run!

```
export FLASK_APP=./app.py
flask run
```

You should now see it running on [`http://127.0.0.1:5000/`](http://127.0.0.1:5000/)

### Testing Webhooks

We can use the Stripe CLI to forward webhook events to our local development server:

- [Install](https://github.com/stripe/stripe-cli#installation) the Stripe CLI.
- Follow the [login steps](https://github.com/stripe/stripe-cli#login) to connect the CLI with your Stripe account.
- Run the [`listen`](https://github.com/stripe/stripe-cli#listen) command to forward the webhooks to localhost:

```
stripe listen --forward-to http://localhost:5000/webhook
```

> **Note:** You do not need to configure any webhook endpoints in your Dashboard to receive webhooks with the CLI.

The Stripe CLI will let you know that webhook forwarding is ready and output your webhook signing secret:

    > Ready! Your webhook signing secret is whsec_xxx

Please copy the webhook signing secret (`whsec_xxx`) to your `.env` file.

## Tests

You can find tests for the API located in the `tests` directory. Make sure you're running in the virtual environment you created earlier.

```
source env/bin/activate
cd tests
python tests.py
```

## Credits

- Code: [Adrienne Dreyfus](http://twitter.com/adrind)
