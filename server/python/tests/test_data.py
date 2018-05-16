import copy

# Just a bunch of test data to use in our tests.
# Most was taken from the webhooks portion of the Dashboard.
# https://dashboard.stripe.com/account/webhooks

mocked_created_order = {
    "id": "or_1CGAuMLz2oBaUePUHh3z2EQ4",
    "object": "order",
    "amount": 444,
    "charge": None,
    "created": 1523560594,
    "currency": "usd",
    "metadata": {"status": "created"},
    "redirect": "",
    "email": "me@cooldomain.com"
}

mocked_pending_order = copy.deepcopy(mocked_created_order)
mocked_pending_order['metadata']['status'] = 'pending'
mocked_failed_order = copy.deepcopy(mocked_created_order)
mocked_failed_order['metadata']['status'] = 'failed'
mocked_paid_order = copy.deepcopy(mocked_created_order)
mocked_paid_order['metadata']['status'] = 'paid'

mocked_source_chargeable_webhook_request = {
    "created": 1326853478,
    "livemode": False,
    "id": "evt_00000000000000",
    "type": "source.chargeable",
    "object": "event",
    "data": {"object": {"id": "src_00000000000000",
                        "object": "source", "amount": None,
                        "client_secret": "src_client_secret_CfY0xjFvOkWpM4XeFBrSEUE8",
                        "created": 1523568262, "currency": "usd", "flow": "receiver", "livemode": False,
                        "metadata": {}, "owner": {"address": None, "email": "jenny.rosen@example.com", "name": None,
                                                  "phone": None, "verified_address": None, "verified_email": None,
                                                  "verified_name": None, "verified_phone": None},
                        "receiver": {"address": "121042882-38381234567890123", "amount_charged": 0,
                                     "amount_received": 0, "amount_returned": 0, "refund_attributes_method": "email",
                                     "refund_attributes_status": "missing"}, "statement_descriptor": None,
                        "status": "chargeable", "type": "ach_credit_transfer", "usage": "reusable",
                        "ach_credit_transfer": {"account_number": "test_52796e3294dc", "routing_number": "110000000",
                                                "fingerprint": "ecpwEzmBOSMOqQTL", "bank_name": "TEST BANK",
                                                "swift_code": "TSTEZ122"}}}}

mock_charge_succeeded_webhook_request = copy.deepcopy(mocked_source_chargeable_webhook_request)
mock_charge_succeeded_webhook_request['type'] = 'charge.succeeded'

mock_source_failed_webhook_request = copy.deepcopy(mocked_source_chargeable_webhook_request)
mock_charge_succeeded_webhook_request['type'] = 'source.failed'

mocked_source = {
    "id": "src_1CGAzALz2oBaUePUcDLqBlys",
    "object": "source",
    "amount": None,
    "currency": None,
    "status": "chargeable",
    "type": "card",
    "usage": "reusable",
    "card": {
        "exp_month": 4,
        "exp_year": 2024,
        "brand": "Visa",
        "three_d_secure": "not required"
    },
    "livemode": False
}

mocked_charge = {"status": "succeeded"}
mocked_failed_charge = {"status": "failed"}

mocked_source_chargable_webhook_event = {
    "created": 1326853478,
    "livemode": False,
    "id": "evt_00000000000000",
    "type": "source.chargeable",
    "object": "event",
    "request": None,
    "pending_webhooks": 1,
    "api_version": "2018-02-28",
    "data": {
        "object": {
            "id": "src_00000000000000",
            "object": "source",
            "amount": None,
            "client_secret": "src_client_secret_CfYJiBYgEmB9s4Tri7RUWcOa", "created": 1523569400,
            "currency": "usd", "flow": "receiver", "livemode": False,
            "owner": {
                "address": None, "email": "jenny.rosen@example.com", "name": None, "phone": None,
                "verified_address": None, "verified_email": None, "verified_name": None, "verified_phone": None
            },
            "receiver": {
                "address": "121042882-38381234567890123", "amount_charged": 0,
                "amount_received": 0, "amount_returned": 0, "refund_attributes_method": "email",
                "refund_attributes_status": "missing"
            },
            "statement_descriptor": None,
            "status": "chargeable",
            "type": "ach_credit_transfer",
            "usage": "reusable",
            "ach_credit_transfer": {
                "account_number": "test_52796e3294dc", "routing_number": "110000000", "fingerprint": "ecpwEzmBOSMOqQTL",
                "bank_name": "TEST BANK", "swift_code": "TSTEZ122"
            },
            "metadata": {"order": mocked_created_order}
        }
    }
}

mocked_charge_suceeded_webhook_event = copy.deepcopy(mocked_source_chargable_webhook_event)
mocked_charge_suceeded_webhook_event['data']['object']['object'] = 'charge'
mocked_charge_suceeded_webhook_event['data']['object']['status'] = 'succeeded'
mocked_charge_suceeded_webhook_event['data']['object']['source'] = {'metadata': {"order": mocked_created_order["id"]}}

mocked_source_failed_webhook_event = copy.deepcopy(mocked_source_chargable_webhook_event)
mocked_source_failed_webhook_event['data']['object']['status'] = 'failed'
mocked_source_failed_webhook_event['data']['object']['source'] = {'metadata': {"order": mocked_created_order}}
