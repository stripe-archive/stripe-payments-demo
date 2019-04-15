<?php

namespace Store;

class Inventory
{
  // This would be a lookup in your database
  private static $products = [
    'increment' => [
      'type' => 'good', 'name'=> 'Increment Magazine', 'attributes' => [ 'issue' ],
      'sku' => [
        'id' => 'increment-03',
        'product' => 'increment',
        'attributes' => [ 'issue' => 'Issue #3 “Development”' ],
        'price' => 399, 'currency' => 'usd',
        'inventory' => [ 'type' => 'infinite' ]
      ]
    ],
    'pins' => [
      'type' => 'good', 'name' => 'Stripe Pins', 'attributes' => [ 'set' ],
      'sku' => [
        'id' => 'pins-collector',
        'product' => 'pins',
        'attributes' => [ 'set' => 'Collector Set' ],
        'price' => 799, 'currency' => 'usd',
        'inventory' => [ 'type' => 'finite', 'quantity' => 500 ]
      ]
    ],
    'shirt' => [
      'type' => 'good', 'name' => 'Stripe Shirt', 'attributes' => ['size', 'gender'],
      'sku' => [
        'id' => 'shirt-small-woman',
        'product' => 'shirt',
        'attributes' => [ 'size' => 'Small Standard', 'gender' => 'Woman' ],
        'price' => 999, 'currency' => 'usd',
        'inventory' =>  [ 'type' => 'infinite' ]
      ]
    ]
  ];

  public static function calculatePaymentAmount($items) {
    $total = 0;
    foreach ($items as $item) {
      $total += self::getSkuPrice($item['parent']) * $item['quantity'];
    }

    return $total;
  }

  public static function listProducts() {
    static $cachedProducts = null;

    if ($cachedProducts) {
      return $cachedProducts;
    }

    $ids = array_keys(self::$products);
    $products = \Stripe\Product::all([ "ids" => $ids ]);
    if (count($products->data) === count($ids)) {
      $cachedProducts = self::withSkus($products);
      return $cachedProducts;
    }

    // Products have not been created yet, do it one by one
    foreach (self::$products as $id => $product) {
      $p = $product;
      $p['id'] = $id;
      unset($p['sku']);

      \Stripe\Product::create($p);
      \Stripe\Sku::create($product['sku']);
    }

    $products = \Stripe\Product::all([ "ids" => $ids ]);
    if (count($products->data) === count($ids)) {
      $cachedProducts = self::withSkus($products);
      return $cachedProducts;
    }

    // Stripe should already have thrown an Exception but just in case
    throw new \RuntimeException("Couldn't retrieve nor create the products in Stripe.");
  }

  protected static function withSkus($products) {
    foreach ($products->data as $i => $product) {
      $products->data[$i]->skus = [ 'data' => [
          \Stripe\Sku::retrieve(self::$products[$product->id]['sku']['id'])
      ]];
    }

    return $products;
  }

  public static function getSkuPrice($id) {
    foreach (self::listProducts()->data as $product) {
      if ($product->skus->data[0]->id == $id) {
        return $product->skus->data[0]->price;
      }
    }

    throw new \UnexpectedValueException('Unknown sku ID. Argument passed: ' . $id);
  }

  public static function getProduct($id) {
    foreach (self::listProducts()->data as $product) {
      if ($product->id == $id) {
        return $product;
      }
    }

    throw new \UnexpectedValueException('Unknown product ID. Argument passed: ' . $id);
  }
}
