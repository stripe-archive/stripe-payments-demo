<?php
use Slim\Http\Request;
use Slim\Http\Response;
use Stripe\Stripe;
use Store\Inventory;
use Store\Shipping;

// Due to a bug in the PHP embedded server, URLs containing a dot don't work
// This will fix the missing variable in that case
if (PHP_SAPI == 'cli-server') {
    $_SERVER['SCRIPT_NAME'] = 'index.php';
}

require __DIR__ . '/vendor/autoload.php';

// Instantiate the app
$settings = require __DIR__ . '/settings.php';
$app = new \Slim\App($settings);

// Instantiate the logger as a dependency
$container = $app->getContainer();
$container['logger'] = function ($c) {
  $settings = $c->get('settings')['logger'];
  $logger = new Monolog\Logger($settings['name']);
  $logger->pushProcessor(new Monolog\Processor\UidProcessor());
  $logger->pushHandler(new Monolog\Handler\StreamHandler($settings['path'], $settings['level']));
  return $logger;
};

// Middleware
$app->add(function ($request, $response, $next) {
  Stripe::setApiKey($this->get('settings')['stripe']['secretKey']);
  $request = $request->withAttribute('staticDir', $this->get('settings')['stripe']['staticDir']);

	return $next($request, $response);
});

// Serve the store
$app->get('/', function (Request $request, Response $response, array $args) {
  return $response->write(file_get_contents($request->getAttribute('staticDir') . 'index.html'));
});

// Serve static assets and images for index.html
$paths = [
  'javascripts' => 'text/javascript', 'stylesheets' => 'text/css',
  'images' => FILEINFO_MIME_TYPE,
  'images/products' => FILEINFO_MIME_TYPE,
  'images/screenshots' => FILEINFO_MIME_TYPE
];
$app->get('/{path:' . implode('|', array_keys($paths)) . '}/{file:[^/]+}',
  function (Request $request, Response $response, array $args) use ($paths) {
    $resource = $request->getAttribute('staticDir') . $args['path'] . '/' . $args['file'];
    if (!is_file($resource)) {
      $notFoundHandler = $this->get('notFoundHandler');
      return $notFoundHandler($request, $response);
    }

    return $response->write(file_get_contents($resource))
      ->withHeader('Content-Type', $paths[$args['path']]);
  }
);

// General config
$app->get('/config', function (Request $request, Response $response, array $args) {
  $config = $this->get('settings')['stripe'];
  return $response->withJson([
    'stripePublishableKey' => $config['publishableKey'],
    'stripeCountry' => $config['accountCountry'],
    'country' => $config['defaultCountry'],
    'currency' => $config['shopCurrency'],
    'paymentMethods' => implode($config['paymentMethods'], ', '),
    'shippingOptions' => Shipping::getShippingOptions()
  ]);
});

// List of fake products on our fake shop
// Used to display the user's cart and calculate the total price
$app->get('/products', function (Request $request, Response $response, array $args) {
  return $response->withJson(Inventory::listProducts());
});

// List of fake products on our fake shop
// Used to display the user's cart and calculate the total price
$app->get('/products/{id}', function (Request $request, Response $response, array $args) {
  return $response->withJson(Inventory::getProduct($args['id']));
});

// Create the payment intent
// Used when the user starts the checkout flow
$app->post('/payment_intents', function (Request $request, Response $response, array $args) {
  $data = $request->getParsedBody();
  try {
    $paymentIntent = \Stripe\PaymentIntent::create([
      'amount' => Inventory::calculatePaymentAmount($data['items']),
      'currency' => $data['currency'],
      'payment_method_types' => $this->get('settings')['stripe']['paymentMethods']
    ]);

    return $response->withJson([ 'paymentIntent' => $paymentIntent ]);
  } catch (\Exception $e) {
    return $response->withJson([ 'error' => $e->getMessage() ])->withStatus(403);
  }
});

// Update the total when selected a different shipping option via the payment request API
$app->post('/payment_intents/{id}/shipping_change', function (Request $request, Response $response, array $args) {
  $data = $request->getParsedBody();
  $amount = Inventory::calculatePaymentAmount($data['items']);
  $amount += Shipping::getShippingCost($data['shippingOption']['id']);
  try {
    $paymentIntent = \Stripe\PaymentIntent::update($args['id'], [ 'amount' => $amount ]);
    return $response->withJson([ 'paymentIntent' => $paymentIntent ]);
  } catch (\Exception $e) {
    return $response->withJson([ 'error' => $e->getMessage() ])->withStatus(403);
  }
});

// Fetch the payment intent status
// Used for redirect sources when coming back to the return URL
$app->get('/payment_intents/{id}/status', function (Request $request, Response $response, array $args) {
    $paymentIntent = \Stripe\PaymentIntent::retrieve($args['id']);
    return $response->withJson([ 'paymentIntent' => [ 'status' => $paymentIntent->status ] ]);
});

// Events receiver for payment intents and sources
$app->post('/webhook', function (Request $request, Response $response, array $args) {
  $logger = $this->get('logger');

  // Parse the message body (and check the signature if possible)
  $webhookSecret = $this->get('settings')['stripe']['webhookSecret'];
  if ($webhookSecret) {
    try {
      $event = \Stripe\Webhook::constructEvent(
        $request->getBody(),
        $request->getHeaderLine('stripe-signature'),
        $webhookSecret
      );
    } catch (\Exception $e) {
      return $response->withJson([ 'error' => $e->getMessage() ])->withStatus(403);
    }
  } else {
    $event = $request->getParsedBody();
  }

  $type = $event['type'];
  $object = $event['data']['object'];

  switch ($object['object']) {
    case 'payment_intent':
      $paymentIntent = $object;
      if ($type == 'payment_intent.succeeded') {
        // Payment intent successfully completed
        $logger->info('🔔  Webhook received! Payment for PaymentIntent ' .
                $paymentIntent['id'] . ' succeeded');
      } elseif ($type == 'payment_intent.payment_failed') {
        // Payment intent completed with failure
        $logger->info('🔔  Webhook received! Payment for PaymentIntent ' . $paymentIntent['id'] . ' failed');
      }
      break;
    case 'source':
      $source = $object;
      if (!isset($source['metadata']['paymentIntent'])) {
        // Could be a source from another integration
        $logger->info('🔔  Webhook received! Source ' . $source['id'] .
              ' did not contain any payment intent in its metadata, ignoring it...');
        continue;
      }

      // Retrieve the payment intent this source was created for
      $paymentIntent = \Stripe\PaymentIntent::retrieve($source['metadata']['paymentIntent']);

      // Check the source status
      if ($source['status'] == 'chargeable') {
        // Source is chargeable, use it to confirm the payment intent if possible
        if (!in_array($paymentIntent->status, [ 'requires_source', 'requires_payment_method' ])) {
          $info = "PaymentIntent {$paymentIntent->id} already has a status of {$paymentIntent->status}";
          $logger->info($info);
          return $response->withJson([ 'info' => $info ])->withStatus(200);
        }

        $paymentIntent->confirm([ 'source' => $source['id'] ]);
      } elseif (in_array($source['status'], [ 'failed', 'canceled' ])) {
        // Source failed or has been canceled, cancel the payment intent to let the polling know
        $logger->info('🔔 Webhook received! Source ' . $source['id'] .
              ' failed or has been canceled, canceling PaymentIntent ' . $paymentIntent->id);
        $paymentIntent->cancel();
      }
      break;
  }

  return $response->withJson([ 'status' => 'success' ])->withStatus(200);
});

// Run app
$app->run();
