"""
inventory.py
Stripe Payments Demo. Created by Adrienne Dreyfus (@adrind).

Simple library to store and interact with orders and products.
These methods are using the Stripe Orders API, but we tried to abstract them
from the main code if you'd like to use your own order management system instead.
"""

import stripe
import os
from functools import reduce
from stripe_types import Order, Product
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
stripe.api_version = '2018-02-06'

class Inventory:
    @staticmethod
    def create_order(currency: str, items: list, email: str, shipping: dict) -> Order:
        return stripe.Order.create(currency=currency, items=items, email=email, shipping=shipping,
                                   metadata={'status': 'created'})

    @staticmethod
    def retrieve_order(order_id: str) -> Order:
        return stripe.Order.retrieve(order_id)

    @staticmethod
    def update_order(properties: dict, order: Order = None, order_id: str = None) -> Order:
        if not order:
            if not order_id:
                print('Error when fetching order -- no id or object given')
            order = Inventory.retrieve_order(order_id)

        order.update(properties)
        return order

    @staticmethod
    def list_products() -> [Product]:
        return stripe.Product.list(limit=3)

    @staticmethod
    def retrieve_product(product_id) -> Product:
        return stripe.Product.retrieve(product_id)

    @staticmethod
    def products_exist(product_list: [Product]) -> bool:
        valid_products = ['increment', 'shirt', 'pins']
        product_list_data = product_list['data']

        return reduce(lambda acc, product: acc and len(product_list_data) == 3 and product['id'] in valid_products,
                      product_list['data'],
                      len(product_list_data) > 0)
