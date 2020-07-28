require 'stripe'
require 'sinatra'
require 'sinatra/cookies'
# require 'sinatra/reloader'
require 'dotenv'
require 'json'
require_relative 'inventory'
require_relative 'setup'

Dotenv.load(File.dirname(__FILE__) + '/../../.env')
Stripe.api_key = ENV['STRIPE_SECRET_KEY']
Stripe.api_version = '2019-03-14'

set :static, true
set :root, File.dirname(__FILE__)
set :public_folder, Dir.chdir(Dir.pwd + '/../../public')


get '/javascripts/:path' do
  content_type 'text/javascript'
  send_file "javascripts/#{params['path']}"
end

get '/stylesheets/:path' do
  content_type 'text/css'
  send_file "stylesheets/#{params['path']}"
end

get '/images/*.*' do |path, ext|
  if ext == "svg"
    content_type "image/#{ext}+xml"
  else
    content_type "image/#{ext}"
  end
  send_file "images/#{path}.#{ext}"
end

get '/' do
  # Route to the index page which will show our cart 
  content_type 'text/html'
  send_file 'index.html'
end

get '/config' do
  # Route to return configurations details required by the frontend
  content_type 'application/json'
  {
    'stripePublishableKey': ENV['STRIPE_PUBLISHABLE_KEY'],
    'stripeCountry': ENV['STRIPE_ACCOUNT_COUNTRY'] || 'US',
    'country': 'US',
    'currency': 'eur',
    'paymentMethods': ENV['PAYMENT_METHODS'] ? ENV['PAYMENT_METHODS'].split(', ') : ['card'],
    'shippingOptions': [
      {
        'id': 'free',
        'label': 'Free Shipping',
      'detail': 'Delivery within 5 days',
        'amount': 0,
      },
      {
        'id': 'express',
          'label': 'Express Shipping',
          'detail': 'Next day delivery',
          'amount': 500,
      }
    ]
  }.to_json
end

get '/products' do
  content_type 'application/json'
  products = Inventory.list_products
  if Inventory.products_exist(products)
    products.to_json
  else
    # Setup products
    puts "Needs to setup products"
    create_data
    products = Inventory.list_products
    products.to_json
  end
end

get '/products/:product_id/skus' do
  content_type 'application/json'
  skus = Inventory.list_skus(params['product_id'])
  skus.to_json
end

get '/products/:product_id' do
  content_type 'application/json'
  product = Inventory.retrieve_product(params['product_id'])
  product.to_json
end

post '/payment_intents' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  payment_intent = Stripe::PaymentIntent.create(
    amount: Inventory.calculate_payment_amount(data['items']),
    currency: data['currency'],
    payment_method_types: ENV['PAYMENT_METHODS'] ? ENV['PAYMENT_METHODS'].split(', ') : ['card']
  )

  {
    paymentIntent: payment_intent
  }.to_json
end

post '/payment_intents/:id/shipping_change' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  amount = Inventory.calculate_payment_amount(data['items'])
  amount += Inventory.get_shipping_cost(data['shippingOption']['id'])

  payment_intent = Stripe::PaymentIntent.update(
    params['id'],
    {
      amount: amount
    }
  )
  
  {
    paymentIntent: payment_intent
  }.to_json
end

post '/webhook' do
  # You can use webhooks to receive information about asynchronous payment events.
  # For more about our webhook events check out https://stripe.com/docs/webhooks.
  webhook_secret = ENV['STRIPE_WEBHOOK_SECRET']
  payload = request.body.read

  if !webhook_secret.empty?
    # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    event = nil

    begin
      event = Stripe::Webhook.construct_event(
          payload, sig_header, webhook_secret
      )
    rescue JSON::ParserError => e
        # Invalid payload
        status 400
        return
    rescue Stripe::SignatureVerificationError => e
        # Invalid signature
        puts "⚠️  Webhook signature verification failed."
        status 400
        return
    end
  else
    data = JSON.parse(payload, symbolize_names: true)
    event = Stripe::Event.construct_from(data)
  end
  # Get the type of webhook event sent - used to check the status of PaymentIntents.    
  event_type = event['type']
  data = event['data']
  data_object = data['object']

  # Monitor payment_intent.succeeded & payment_intent.payment_failed events.
  if data_object['object'] == 'payment_intent'
    payment_intent = data_object

    if event_type == 'payment_intent.succeeded'
      puts "🔔  Webhook received! Payment for PaymentIntent #{payment_intent['id']} succeeded"
    elsif event_type == 'payment_intent.payment_failed'
      if payment_intent['last_payment_error']['payment_method'].nil?
        payment_source_or_method = payment_intent['last_payment_error']['source']
      else 
        payment_source_or_method = payment_intent['last_payment_error']['payment_method']
      end
      puts "🔔  Webhook received! Payment on #{payment_source_or_method['object']} #{payment_source_or_method['id']} for PaymentIntent #{payment_intent['id']} failed."
    end

  # Monitor `source.chargeable` events.
  elsif data_object['object'] == 'source' && data_object['status'] == 'chargeable' && !data_object['metadata']['paymentIntent'].nil?
    source = data_object
    puts "🔔  Webhook received! The source #{source['id']} is chargeable"

    # Find the corresponding PaymentIntent this Source is for by looking in its metadata.
    payment_intent = Stripe::PaymentIntent.retrieve(
      source['metadata']['paymentIntent']
    )

    # Verify that this PaymentIntent actually needs to be paid.
    if payment_intent['status'] != 'requires_payment_method'
      status 403
      {
        error: "PaymentIntent already has a status of #{payment_intent['status']}"
      }.to_json
    end

    # Confirm the PaymentIntent with the chargeable source.
    payment_intent.confirm(
      {
        source: source['id']
      }
    )
  
  # Monitor `source.failed` and `source.canceled` events.  
  elsif data_object['object'] == 'source' && ['failed', 'canceled'].include?(data_object['status'])
    # Cancel the PaymentIntent.
    source = data_object
    intent = Stripe::PaymentIntent.retrieve(
      source['metadata']['paymentIntent']
    )
    puts "🔔  Webhook received! Source #{source['id']} failed or canceled. Cancelling #{intent['id']}."
    intent.cancel
  end

  content_type 'application/json'
  {
    status: 'success'
  }.to_json

end

get '/payment_intents/:id/status' do
  payment_intent = Stripe::PaymentIntent.retrieve(
    params['id']
  )

  data = {
    paymentIntent: {
      status: payment_intent['status']
    }
  }

  data[:paymentIntent] = data[:paymentIntent].merge(
    last_payment_error: payment_intent.last_payment_error.message
  ) if payment_intent.last_payment_error

  content_type 'application/json'
  data.to_json
end
