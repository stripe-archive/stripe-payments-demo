<?php
$iniFilename = __DIR__ . '/settings.ini';
if (!is_file($iniFilename)) {
  die('Missing settings.ini file.');
}

$settings = parse_ini_file($iniFilename);
if (!$settings) {
  die('Unable to read settings.ini file. Please check file format and read access.');
}

return [
    'settings' => [
        'displayErrorDetails' => true, // set to false in production
        'addContentLengthHeader' => false, // Allow the web server to send the content-length header

        // Monolog settings
        'logger' => [
            'name' => 'slim-app',
            'path' => isset($_ENV['docker']) ? 'php://stdout' : __DIR__ . '/logs/app.log',
            'level' => \Monolog\Logger::DEBUG,
        ],

        'stripe' => [
          // You shouldn't have to touch this
          'apiVersion' => '2019-03-14',

          // Update this path if you want to move your public folder
          'staticDir' => __DIR__ . '/../../public/',

          // Adapt these to match your account payments settings
          // https://dashboard.stripe.com/account/payments/settings
          'paymentMethods' => [
            // 'ach_credit_transfer', // usd (ACH Credit Transfer payments must be in U.S. Dollars)
            'alipay', // aud, cad, eur, gbp, hkd, jpy, nzd, sgd, or usd.
            'bancontact', // eur (Bancontact must always use Euros)
            'card', // many (https://stripe.com/docs/currencies#presentment-currencies)
            'eps', // eur (EPS must always use Euros)
            'ideal', // eur (iDEAL must always use Euros)
            'giropay', // eur (Giropay must always use Euros)
            'multibanco', // eur (Multibanco must always use Euros)
            'p24', // eur, pln
            // 'sepa_debit', // Restricted. See docs for activation details: https://stripe.com/docs/sources/sepa-debit
            'sofort', // eur (SOFORT must always use Euros)
            'wechat', // aud, cad, eur, gbp, hkd, jpy, sgd, or usd.,
            'au_becs_debit' //aud
          ],

          // See settings.ini
          'publishableKey' => $settings['publishableKey'],
          'secretKey' => $settings['secretKey'],
          'webhookSecret' => $settings['webhookSecret'],
          'accountCountry' => $settings['accountCountry'],
          'shopCurrency' => $settings['shopCurrency'],
          'defaultCountry' => $settings['defaultCountry']
        ]
    ],
];
