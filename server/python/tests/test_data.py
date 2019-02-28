import copy

# Just a bunch of test data to use in our tests.
# Most was taken from the webhooks portion of the Dashboard.
# https://dashboard.stripe.com/account/webhooks

mock_payment_intent = {
  "id": "pi_Aabcxyz01aDfoo",
  "object": "payment_intent",
  "amount": 1000,
  "amount_capturable": 1000,
  "amount_received": 0,
  "application": None,
  "application_fee_amount": None,
  "canceled_at": None,
  "cancellation_reason": None,
  "capture_method": "automatic",
  "charges": {
    "object": "list",
    "data": [],
    "has_more": False,
    "total_count": 0,
    "url": "/v1/charges?payment_intent=pi_Aabcxyz01aDfoo"
  },
  "client_secret": None,
  "confirmation_method": "publishable",
  "created": 123456789,
  "currency": "usd",
  "customer": None,
  "description": "PaymentIntent Description",
  "last_payment_error": None,
  "livemode": False,
  "metadata": {
    "order_id": "123456789"
  },
  "next_action": None,
  "on_behalf_of": None,
  "payment_method_types": [
    "card"
  ],
  "receipt_email": "jenny@example.com",
  "review": None,
  "shipping": {
    "address": {
      "city": "SF",
      "country": "US",
      "line1": "123 Main st",
      "line2": "",
      "postal_code": "94703",
      "state": "CA"
    },
    "carrier": None,
    "name": "Adrienne Dreyfus",
    "phone": "+16507047927",
    "tracking_number": None
  },
  "source": "src_1E8u7Q2eZvKYlo2CRRE5r3oQ",
  "statement_descriptor": "PaymentIntent Statement Descriptor",
  "status": "succeeded",
  "transfer_data": None,
  "transfer_group": None
}

