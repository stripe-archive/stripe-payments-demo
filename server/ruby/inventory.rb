require 'stripe'
require 'dotenv'

Dotenv.load(File.dirname(__FILE__) + '/../../.env')

Stripe.api_key = ENV['STRIPE_SECRET_KEY']
Stripe.api_version = '2019-02-11'

# For product retrieval and listing set API version to 2018-02-28 so that skus are returned.
@@product_api_stripe_version = '2018-02-28'

class Inventory
  def self.calculate_payment_amount(items)
    Stripe.api_version = @@product_api_stripe_version
    product_list = Stripe::Product.list(limit: 3)
    product_list_data = product_list['data']

    total = 0
    items.each do |item|
      sku_id = item['parent']
      product = product_list_data.find {|product| product['skus']['data'][0]['id'] == sku_id}
      total += product['skus']['data'][0]['price'] * item['quantity']
    end
    total
  end

  def self.get_shipping_cost(id)
    shipping_cost = {
      free: 0,
      express: 500
    }
    shipping_cost[id]
  end

  def self.list_products
    Stripe.api_version = @@product_api_stripe_version
    Stripe::Product.list(limit: 3)
  end

  def self.retrieve_product(product_id)
    Stripe.api_version = @@product_api_stripe_version
    Stripe::Product.retrieve(product_id)
  end

  def self.products_exist(product_list)
    valid_products = ['increment', 'shirt', 'pins']
    product_list_data = product_list['data']
    products_present = product_list_data.map {|product| product['id']}

    product_list_data.length == 3 && products_present & valid_products == products_present
  end
end