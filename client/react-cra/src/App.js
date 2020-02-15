import React, {useEffect, useState} from 'react';
import Header from './components/Header';
import Aside from './components/Aside';
import {randomQuantity} from './utils/helpers';

function App() {
  // TODO fetch config
  const [config, setCOnfig] = useState({
    stripePublishableKey: 'pk_test_PInFiPUnGR6pzLYZ2IE6oyPf',
    stripeCountry: 'FR',
    country: 'US',
    currency: 'eur',
    paymentMethods: [
      'alipay',
      'bancontact',
      'card',
      'eps',
      'ideal',
      'giropay',
      'multibanco',
      'sepa_debit',
      'sofort',
      'wechat',
    ],
    shippingOptions: [
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
      },
    ],
  });
  const [cart, setCart] = useState();
  useEffect(_ => {
    // Fetch the products from the API.
    (async _ => {
      const res = await fetch('/products').then(res => res.json());
      const products = res.data;
      const items = products.map(product => ({
        price: product.skus.data[0].price,
        quantity: randomQuantity(1, 2),
        type: 'sku',
        id: product.id,
        name: product.name,
        parent: product.skus.data[0].id,
        attributes: product.skus.data[0].attributes,
      }));
      setCart({
        currency: config.currency,
        items,
        total: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
      });
    })();
  }, []);

  return (
    <>
      <main id="main" className={cart ? 'checkout' : 'loading'}>
        <Header />
      </main>
      <Aside cart={cart}></Aside>
    </>
  );
}

export default App;
