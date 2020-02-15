import React from 'react';
import Cart from './Cart';
import OrderOverview from './OrderOverview';

const Aside = () => (
  <aside id="summary">
    <div className="header">
      <h1>Order Summary</h1>
    </div>
    <Cart />
    <OrderOverview />
  </aside>
);

export default Aside;
