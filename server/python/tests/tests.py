"""
tests.py
Stripe Payments Demo. Created by Adrienne Dreyfus (@adrind).

This is a test suite for our webhooks and /pay endpoints.
It uses the data mocked in test_data.py to create sample requests and responses.
"""

import json
import os
from unittest import mock, TestCase, main
from dotenv import load_dotenv, find_dotenv
from test_data import *
from stripe.error import CardError

import sys

sys.path.append('../')
from app import app as flask_app, stripe
from inventory import Inventory


class AppTestCase(TestCase):
    def setUp(self):
        load_dotenv(find_dotenv())
        flask_app.testing = True

        # See https://github.com/pallets/flask/issues/2549
        flask_app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
        self.app = flask_app.test_client()

    def test_config(self):
        response = self.app.get('/config')
        self.assertListEqual(list(json.loads(response.data).keys()),
                             ['country', 'currency', 'paymentMethods', 'stripeCountry', 'stripePublishableKey'])
        self.assertEqual(response.status_code, 200)

    def test_create_payment_intent(self):
        """
        We should be able to create a PaymentIntent with the amount calculated by calculate_payment_amount.
        """
        Inventory.calculate_payment_amount = mock.MagicMock(return_value=500)
        response = self.app.post(f'payment_intents', data=json.dumps({'items': [], 'currency': 'eur'}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data)['paymentIntent']['amount'], 500)

    def test_payment_intent_updated_on_shipping(self):
        """
        We should not be able to update a PaymentIntent with new shipping amount.
        """
        order_amount = 500
        shipping_amount = 500
        Inventory.calculate_payment_amount = mock.MagicMock(return_value=order_amount)
        stripe.PaymentIntent.modify = mock.MagicMock(return_value={})
        response = self.app.post(f'payment_intents/pi_1234/shipping_change', data=json.dumps({'items': [], 'shippingOption': { 'id': 'express' }}))
        stripe.PaymentIntent.modify.assert_called_once_with('pi_1234', amount=order_amount + shipping_amount)
        self.assertEqual(response.status_code, 200)


if __name__ == '__main__':
    main()
