"""
app.py
Stripe Payments Demo. Created by Adrienne Dreyfus (@adrind).

This is our Flask server that handles requests from our Stripe checkout flow.
It has all the endpoints you need to accept payments and manage orders.
"""

import stripe
import json
import setup
import os

from inventory import Inventory
from stripe_types import Source, Order
from flask import Flask, render_template, jsonify, request, send_from_directory
from dotenv import load_dotenv, find_dotenv

static_dir = f'{os.path.abspath(os.path.join(__file__ ,"../../.."))}/public'
app = Flask(__name__, static_folder=static_dir)


def dynamic_3ds(source: Source, order: Order) -> Source:
    """
    Create a 3DS Secure payment Source if the Source is a card that requires it or if the Order is over 5000.
    """
    if source['card']['three_d_secure'] == 'required' or order['amount'] > 5000:
        source = stripe.Source.create(amount=order['amount'], currency=order['currency'], type='three_d_secure',
                                      three_d_secure={'card': source['id']}, metadata={'order': order['id']},
                                      redirect={'return_url': request.headers.get('origin')})
    return source


@app.route('/')
def home():
    return send_from_directory(static_dir, 'index.html')


# Serve static assets and images for index.html
# Note: You can remove this if your frontend code is using Flask's templating
@app.route('/javascripts/<path:path>', methods=['GET'])
def serve_js(path):
    return send_from_directory(f'{static_dir}/javascripts', path)


@app.route('/stylesheets/<path:path>', methods=['GET'])
def serve_css(path):
    return send_from_directory(f'{static_dir}/stylesheets', path)


@app.route('/images/<path:path>', methods=['GET'])
def serve_image(path):
    return send_from_directory(f'{static_dir}/images', path)


# Serve config set up in .env
@app.route('/config')
def get_config():
    return jsonify({
        'stripePublishableKey': os.getenv('STRIPE_PUBLISHABLE_KEY'),
        'stripeCountry': os.getenv('STRIPE_ACCOUNT_COUNTRY') or 'US',
        'country': 'US',
        'currency': 'eur'
    })


@app.route('/products', methods=['GET'])
def get_products():
    products = Inventory.list_products()
    if Inventory.products_exist(products):
        return jsonify(products)
    else:
        # Create Products for our Stripe store if we haven't already.
        setup.create_data()
        products = Inventory.list_products()
        return jsonify(products)


@app.route('/products/<string:product_id>', methods=['GET'])
def retrieve_product(product_id):
    return jsonify(Inventory.retrieve_product(product_id))


@app.route('/orders', methods=['POST'])
def make_order():
    # Creates a new Order with items that the user selected.
    data = json.loads(request.data)
    try:
        order = Inventory.create_order(currency=data['currency'], items=data['items'], email=data['email'],
                                           shipping=data['shipping'])

        return jsonify({'order': order})
    except Exception as e:
        return jsonify(e), 403


@app.route('/orders/<string:order_id>/pay', methods=['POST'])
def pay_order(order_id):
    """
    Creates a Charge for an Order using a payment Source provided by the user.
    """

    data = json.loads(request.data)
    source = data['source']

    order = Inventory.retrieve_order(order_id)

    if order['metadata']['status'] == 'pending' or order['metadata']['status'] == 'paid':
        # Somehow this Order has already been paid for -- abandon request.
        return jsonify({'source': source, 'order': order}), 403

    if source['type'] == 'card':
        source = dynamic_3ds(source, order)

    if not source['livemode']:
        # Demo: In test mode, replace the Source with a test token so Charges can work.
        source['id'] = 'tok_visa'

    if source['status'] == 'chargeable':
        # Yay! Our user gave us a valid payment Source we can charge.
        charge = stripe.Charge.create(source=source['id'], amount=order['amount'], currency=order['currency'],
                                      receipt_email=order['email'], idempotency_key=order['id'])

        if charge and charge['status'] == 'succeeded':
            status = 'paid'
        elif charge and 'status' in charge:
            status = charge['status']
        else:
            status = 'failed'

        # Update the Order with a new status based on what happened with the Charge.
        Inventory.update_order(properties={'metadata': {'status': status}}, order=order)

    return jsonify({'order': order, 'source': source})


@app.route('/webhook', methods=['POST'])
def webhook_received():
    # You can use webhooks to receive information about asynchronous payment events.
    # For more about our webhook events check out https://stripe.com/docs/webhooks.
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    request_data = json.loads(request.data)

    if webhook_secret:
        # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
        signature = request.headers.get('stripe-signature')
        try:
            event = stripe.Webhook.construct_event(payload=request.data, sig_header=signature, secret=webhook_secret)
            data = event['data']
        except Exception as e:
            return e
    else:
        data = request_data['data']

    data_object = data['object']

    # Monitor `source.chargeable` events.
    if data_object['object'] == 'source' \
            and data_object['status'] == 'chargeable' \
            and 'order' in data_object['metadata']:
        source = data_object
        print(f'Webhook received! The source {source["id"]} is chargeable')

        # Find the corresponding Order this Source is for by looking in its metadata.
        order = Inventory.retrieve_order(source['metadata']['order'])

        # Verify that this Order actually needs to be paid.
        order_status = order['metadata']['status']
        if order_status in ['pending', 'paid', 'failed']:
            return jsonify({'error': f'Order already has a status of {order_status}'}), 403

        # Create a Charge to pay the Order using the Source we just received.
        try:
            charge = stripe.Charge.create(source=source['id'], amount=order['amount'], currency=order['currency'],
                                          receipt_email=order['email'], idempotency_key=order['id'])

            if charge and charge['status'] == 'succeeded':
                status = 'paid'
            elif charge:
                status = charge['status']
            else:
                status = 'failed'

        except stripe.error.CardError:
            # This is where you handle declines and errors.
            # For the demo, we simply set the status to mark the Order as failed.
            status = 'failed'

        Inventory.update_order(properties={'metadata': {'status': status}}, order=order)

    # Monitor `charge.succeeded` events.
    if data_object['object'] == 'charge' \
            and data_object['status'] == 'succeeded' \
            and 'order' in data_object['source']['metadata']:
        charge = data_object
        print(f'Webhook received! The charge {charge["id"]} succeeded.')
        Inventory.update_order(properties={'metadata': {'status': 'paid'}},
                                   order_id=charge['source']['metadata']['order'])

    # Monitor `source.failed`, `source.canceled`, and `charge.failed` events.
    if data_object['object'] in ['source', 'charge'] and data_object['status'] in ['failed', 'canceled']:
        source = data_object['source'] if data_object['source'] else data_object
        print(f'Webhook received! Failure for {data_object["id"]}.`')

        if source['metadata']['order']:
            Inventory.update_order(properties={'metadata': {'status': 'failed'}},
                                       order_id=source['metadata']['order']['id'])

    return jsonify({'status': 'success'})


if __name__ == 'main':
    load_dotenv(find_dotenv())
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    stripe.api_version = '2018-02-06'
