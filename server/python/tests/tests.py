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
from stripe import CardError

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
                             ['country', 'currency', 'stripeCountry', 'stripePublishableKey'])
        self.assertEqual(response.status_code, 200)

    def test_pay_pending_order(self):
        """
        We should not be able to create a Charge for an Order that's already pending.
        """
        Inventory.retrieve_order = mock.MagicMock(return_value=mocked_pending_order)
        response = self.app.post(f'orders/{mocked_failed_order["id"]}/pay', data=json.dumps({'source': mocked_source}))
        self.assertEqual(response.status_code, 403)

    def test_pay_paid_order(self):
        """
        We should not be able to create a Charge for an Order that's already paid.
        """
        Inventory.retrieve_order = mock.MagicMock(return_value=mocked_paid_order)
        response = self.app.post(f'orders/{mocked_failed_order["id"]}/pay', data=json.dumps({'source': mocked_source}))
        self.assertEqual(response.status_code, 403)

    def test_pay_created_order(self):
        """
        Mark the Order as paid if we successful charge the Source in the payment flow.
        """
        Inventory.retrieve_order = mock.MagicMock(return_value=mocked_created_order)
        stripe.Charge.create = mock.MagicMock(return_value=mocked_charge)
        Inventory.update_order = mock.MagicMock(return_value=mocked_created_order)

        response = self.app.post(f'orders/{mocked_failed_order["id"]}/pay', data=json.dumps({'source': mocked_source}))
        Inventory.update_order.assert_called_once_with(properties={'metadata': {'status': 'paid'}},
                                                           order=mocked_created_order)

        self.assertEqual(response.status_code, 200)

    def test_pay_order_failed_to_charge(self):
        """
        Mark the Order as failed to pay if we fail to create a Charge in the payment flow.
        """
        Inventory.retrieve_order = mock.MagicMock(return_value=mocked_created_order)
        stripe.Charge.create = mock.MagicMock(return_value=mocked_failed_charge)
        Inventory.update_order = mock.MagicMock(return_value=mocked_created_order)

        response = self.app.post(f'orders/{mocked_failed_order["id"]}/pay', data=json.dumps({'source': mocked_source}))
        Inventory.update_order.assert_called_once_with(properties={'metadata': {'status': 'failed'}},
                                                           order=mocked_created_order)

        self.assertEqual(response.status_code, 200)

    def test_source_chargeable_webhook(self):
        """
        We should be able to receive the 'source.chargeable' webhook event and create a Charge.
        """
        Inventory.retrieve_order = mock.MagicMock(return_value=mocked_created_order)
        stripe.Charge.create = mock.MagicMock(return_value=mocked_charge)
        Inventory.update_order = mock.MagicMock(return_value=mocked_created_order)
        stripe.Webhook.construct_event = mock.MagicMock(return_value=mocked_source_chargable_webhook_event)

        response = self.app.post(f'webhook', data=json.dumps(mocked_source_chargeable_webhook_request),
                                 headers={'stripe-signature': os.getenv('STRIPE_WEBHOOK_SECRET')})

        self.assertEqual(response.status_code, 200)

        Inventory.update_order.assert_called_once_with(properties={'metadata': {'status': 'paid'}},
                                                           order=mocked_created_order)

    def test_charge_succeeded_webhook(self):
        """
        We should be able to receive the 'charge.suceeded' webhook event and update the Order status to paid.
        """
        Inventory.update_order = mock.MagicMock(return_value=mocked_paid_order)
        stripe.Webhook.construct_event = mock.MagicMock(return_value=mocked_charge_suceeded_webhook_event)

        response = self.app.post(f'webhook', data=json.dumps(mock_charge_succeeded_webhook_request),
                                 headers={'stripe-signature': os.getenv('STRIPE_WEBHOOK_SECRET')})

        self.assertEqual(response.status_code, 200)

        Inventory.update_order.assert_called_once_with(properties={'metadata': {'status': 'paid'}},
                                                           order_id=mocked_paid_order['id'])

    def test_source_chargeable_webhook_with_already_pending_payment(self):
        """
        If our Source is chargeable but the Order has a status of pending instead of created, send a 403.
        """
        Inventory.retrieve_order = mock.MagicMock(return_value=mocked_pending_order)
        stripe.Charge.create = mock.MagicMock(return_value=mocked_charge)
        Inventory.update_order = mock.MagicMock(return_value=mocked_pending_order)
        stripe.Webhook.construct_event = mock.MagicMock(return_value=mocked_source_chargable_webhook_event)

        response = self.app.post(f'webhook', data=json.dumps(mocked_source_chargeable_webhook_request),
                                 headers={'stripe-signature': os.getenv('STRIPE_WEBHOOK_SECRET')})
        self.assertEqual(response.status_code, 403)

    def test_source_chargeable_webhook_throws_exception_bad_charge(self):
        """
        If our Source is chargeable and something happens when create the Charge we throw an Exception.
        """
        Inventory.retrieve_order = mock.MagicMock(return_value=mocked_created_order)
        stripe.Charge.create = mock.MagicMock(side_effect=CardError('Test card error message', '', ''))
        Inventory.update_order = mock.MagicMock(return_value=mocked_created_order)
        stripe.Webhook.construct_event = mock.MagicMock(return_value=mocked_source_chargable_webhook_event)

        response = self.app.post(f'webhook', data=json.dumps(mocked_source_chargeable_webhook_request),
                                 headers={'stripe-signature': os.getenv('STRIPE_WEBHOOK_SECRET')})
        self.assertEqual(response.status_code, 200)

        Inventory.update_order.assert_called_once_with(properties={'metadata': {'status': 'failed'}},
                                                           order=mocked_created_order)

    def test_source_failed_webhook(self):
        """
        We should updated our Order status to failed for our 'source.canceled' and 'charge.failed' webhook events.
        """
        Inventory.update_order = mock.MagicMock(return_value=mocked_paid_order)
        stripe.Webhook.construct_event = mock.MagicMock(return_value=mocked_source_failed_webhook_event)

        response = self.app.post(f'webhook', data=json.dumps(mock_charge_succeeded_webhook_request),
                                 headers={'stripe-signature': os.getenv('STRIPE_WEBHOOK_SECRET')})

        self.assertEqual(response.status_code, 200)

        Inventory.update_order.assert_called_once_with(properties={'metadata': {'status': 'failed'}},
                                                           order_id=mocked_paid_order['id'])


if __name__ == '__main__':
    main()
