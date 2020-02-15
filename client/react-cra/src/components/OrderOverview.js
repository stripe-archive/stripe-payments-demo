import React from 'react';
import {formatAmountForDisplay} from '../utils/helpers';

const DemoNotice = () => (
  <div id="demo">
    <p className="label">Demo in test mode</p>
    <p className="note">
      You can copy and paste the following test cards to trigger different
      scenarios:
    </p>
    <table className="note">
      <tbody>
        <tr>
          <td>Default US card:</td>
          <td className="card-number">
            4242<span></span>4242<span></span>4242<span></span>4242
          </td>
        </tr>
        <tr>
          <td>
            <a
              href="https://stripe.com/guides/strong-customer-authentication"
              target="_blank"
              rel="noopener noreferrer"
            >
              Authentication
            </a>{' '}
            required:
          </td>
          <td className="card-number">
            4000<span></span>0027<span></span>6000<span></span>3184
          </td>
        </tr>
      </tbody>
    </table>
    <p className="note">
      See the{' '}
      <a
        href="https://stripe.com/docs/testing#cards"
        target="_blank"
        rel="noopener noreferrer"
      >
        docs
      </a>{' '}
      for a full list of test cards. Non-card payments will redirect to test
      pages.
    </p>
  </div>
);

const OrderOverview = ({cart}) => (
  <div id="order-total">
    {cart ? (
      <div id="order-total">
        <div className="line-item subtotal">
          <p className="label">Subtotal</p>
          <p className="price" data-subtotal="">
            {formatAmountForDisplay(cart.total, cart.currency)}
          </p>
        </div>
        <div className="line-item shipping">
          <p className="label">Shipping</p>
          <p className="price">Free</p>
        </div>
        <div className="line-item demo">
          <DemoNotice />
        </div>
        <div className="line-item total">
          <p className="label">Total</p>
          <p className="price" data-total="">
            {formatAmountForDisplay(cart.total, cart.currency)}
          </p>
        </div>
      </div>
    ) : (
      ''
    )}
  </div>
);

export default OrderOverview;
