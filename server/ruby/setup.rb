require 'stripe'
require 'dotenv'

Dotenv.load(File.dirname(__FILE__) + '/../../.env')

Stripe.api_key = ENV['STRIPE_SECRET_KEY']
Stripe.api_version = '2019-03-14'

def create_data
  begin
    products = [
      {
        id: 'increment',
        type: 'good',
        name: 'Increment Magazine',
        attributes: ['issue']
      },
      {
        id: 'pins',
        type: 'good',
        name: 'Stripe Pins',
        attributes: ['set']
      },
      {
        id: 'shirt',
        type: 'good',
        name: 'Stripe Shirt',
        attributes: ['size', 'gender']
      }
    ]

    products.each do |product|
      Stripe::Product.create(product)
    end

    skus = [
      {
        id: 'increment-03',
        product: 'increment',
        attributes: {
          issue: 'Issue #3 “Development”'
        },
        price: 399,
        currency: 'usd',
        inventory: {
          type: 'infinite'
        }
      },
      {
        id: 'shirt-small-woman',
        product: 'shirt',
        attributes: {
          size: 'Small Standard',
          gender: 'Woman'
        },
        price: 999,
        currency: 'usd',
        inventory: {
          type: 'infinite'
        }
      },
      {
        id: 'pins-collector',
        product: 'pins',
        attributes: {
          set: 'Collector Set'
        },
        price: 799,
        currency: 'usd',
        inventory: {
          type: 'finite',
          quantity: 500
        }
      }
    ]

    skus.each do |sku|
      Stripe::SKU.create(sku)
    end

  rescue Stripe::InvalidRequestError => e
    puts "Products already exist, #{e}"
  end
end