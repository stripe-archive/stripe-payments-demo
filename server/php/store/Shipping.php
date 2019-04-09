<?php

namespace Store;

class Shipping
{
  // This would be a lookup in your database
  public static $options = [
    'free' => [ 'label' => 'Free Shipping', 'detail' => 'Delivery within 5 days', 'amount' => 0 ],
    'express' => [ 'label' => 'Express Shipping', 'detail' => 'Next day delivery', 'amount' => 500 ]
  ];

  public static function getShippingOptions() {
    $shippingOptions = [];
    foreach (self::$options as $id => $option) {
      $shippingOptions[] = array_merge([ 'id' => $id ], $option);
    }
    
    return $shippingOptions;
  }

  public static function getShippingCost($id) {
    if (isset(self::$options[$id])) {
      return self::$options[$id]['amount'];
    }

    throw new \UnexpectedValueException('Unknown shipping option ID. Argument passed: ' . $id);
  }
}
