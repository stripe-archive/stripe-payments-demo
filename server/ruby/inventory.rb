require 'stripe'
require 'dotenv'

Dotenv.load(File.dirname(__FILE__) + '/../../.env')

Stripe.api_key = ENV['STRIPE_SECRET_KEY']
Stripe.api_version = '2019-03-14'

class Inventory

  def self.shipping_options
    [
      {
        id: 'free',
        label: 'Free Shipping',
        detail: 'Delivery within 5 days',
        amount: 0,
      },
      {
        id: 'express',
        label: 'Express Shipping',
        detail: 'Next day delivery',
        amount: 500,
      }
    ]
  end

  def self.calculate_payment_amount(items)
    total = 0
    items.each do |item|
      sku = Stripe::SKU.retrieve(item['parent'])
      total += sku.price * item['quantity']
    end
    total
  end

  def self.get_shipping_cost(id)
    option = shipping_options.find { |option| option[:id] == id.to_sym }
    option[:amount]
  end

  def self.list_products
    Stripe::Product.list(limit: 3)
  end

  def self.list_skus(product_id)
    Stripe::SKU.list(
      limit: 1,
      product: product_id
    )
  end

  def self.retrieve_product(product_id)
    Stripe::Product.retrieve(product_id)
  end

  def self.products_exist(product_list)
    valid_products = ['increment', 'shirt', 'pins']
    product_list_data = product_list['data']
    products_present = product_list_data.map {|product| product['id']}

    product_list_data.length == 3 && products_present & valid_products == products_present
  end
end
