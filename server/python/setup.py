"""
setup.py
Stripe Payments Demo. Created by Adrienne Dreyfus (@adrind).

This is a one-time setup script for your server. It creates a set of fixtures,
namely products and SKUs, that can then used to caluclate payment amounts when completing the
checkout flow in the web interface.
"""

import stripe
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
stripe.api_version = '2019-02-11'


def create_data():
    try:
        products = [{'id': 'increment', 'type': 'good', 'name': 'Increment Magazine', 'attributes': ['issue']},
                    {'id': 'pins', 'type': 'good',
                        'name': 'Stripe Pins', 'attributes': ['set']},
                    {'id': 'shirt', 'type': 'good', 'name': 'Stripe Shirt', 'attributes': ['size', 'gender']}]

        for product in products:
            stripe.Product.create(**product)

        skus = [{'id': 'increment-03', 'product': 'increment', 'attributes': {'issue': 'Issue #3 “Development”'},
                 'price': 399, 'currency': 'usd', 'inventory': {'type': 'infinite'}},
                {'id': 'shirt-small-woman', 'product': 'shirt',
                 'attributes': {'size': 'Small Standard', 'gender': 'Woman'},
                 'price': 999, 'currency': 'usd', 'inventory': {'type': 'infinite'}},
                {'id': 'pins-collector', 'product': 'pins', 'attributes': {'set': 'Collector Set'},
                 'price': 799, 'currency': 'usd', 'inventory': {'type': 'finite', 'quantity': 500}}]

        for sku in skus:
            stripe.SKU.create(**sku)

    except stripe.InvalidRequestError as e:
        print('Products already exist', e)
