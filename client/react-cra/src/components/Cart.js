import React from 'react';
import {formatAmountForDisplay} from '../utils/helpers';

const Cart = ({cart}) => (
  <div id="order-items">
    {cart?.items?.map(item => (
      <div className="line-item" key={item.id}>
        <img
          className="image"
          src={`/images/products/${item.id}.png`}
          alt={item.name}
        />
        <div className="label">
          <p className="product">{item.name}</p>
          <p className="sku">{Object.values(item.attributes).join(' ')}</p>
        </div>
        <p className="count">{`${item.quantity} x ${formatAmountForDisplay(
          item.price,
          cart.currency
        )}`}</p>
        <p className="price">
          {formatAmountForDisplay(item.price, cart.currency)}
        </p>
      </div>
    )) ?? ''}
  </div>
);

export default Cart;
