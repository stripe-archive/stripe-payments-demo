import React from 'react';
import Cart from './Cart';
import OrderOverview from './OrderOverview';

const Aside = ({cart}) => (
  <aside id="summary">
    <div className="header">
      <h1>Order Summary</h1>
    </div>
    <Cart cart={cart} />
    <OrderOverview cart={cart} />
  </aside>
);

export default Aside;
