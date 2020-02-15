import React from 'react';
import paymentMethods from '../utils/payment-methods';
import {CardElement} from '@stripe/react-stripe-js';

const CARD_ELEMENT_STYLES = {
  base: {
    iconColor: '#666ee8',
    color: '#31325f',
    fontWeight: 400,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '15px',
    '::placeholder': {
      color: '#aab7c4',
    },
    ':-webkit-autofill': {
      color: '#666ee8',
    },
  },
};

const PaymentInformation = () => {
  const handlePaymentMethodSelection = event => {
    event.preventDefault();
    const payment = event.target.value;
    const form = document.getElementById('payment-form');
    const flow = paymentMethods[payment].flow;

    // Show the relevant details, whether it's an extra element or extra information for the user.
    form
      .querySelector('.payment-info.card')
      .classList.toggle('visible', payment === 'card');
    form
      .querySelector('.payment-info.ideal')
      .classList.toggle('visible', payment === 'ideal');
    form
      .querySelector('.payment-info.sepa_debit')
      .classList.toggle('visible', payment === 'sepa_debit');
    form
      .querySelector('.payment-info.wechat')
      .classList.toggle('visible', payment === 'wechat');
    form
      .querySelector('.payment-info.redirect')
      .classList.toggle('visible', flow === 'redirect');
    form
      .querySelector('.payment-info.receiver')
      .classList.toggle('visible', flow === 'receiver');
    document
      .getElementById('card-errors')
      .classList.remove('visible', payment !== 'card');
  };

  return (
    <section>
      <h2>Payment Information</h2>
      <nav id="payment-methods">
        <ul>
          {Object.keys(paymentMethods).map(method => (
            <li key={method}>
              <input
                type="radio"
                name="payment"
                id={`payment-${method}`}
                value={method}
                onChange={handlePaymentMethodSelection}
                checked={method === 'card'}
              />
              <label htmlFor={`payment-${method}`}>
                {paymentMethods[method].name}
              </label>
            </li>
          ))}
        </ul>
      </nav>
      <div className="payment-info card visible">
        <fieldset>
          <label>
            <span>Card</span>
            <div id="card-element" className="field">
              <CardElement options={{style: CARD_ELEMENT_STYLES}} />
            </div>
          </label>
        </fieldset>
      </div>
      <div className="payment-info sepa_debit">
        <fieldset>
          <label>
            <span>IBAN</span>
            <div id="iban-element"></div>
          </label>
        </fieldset>
        <p className="notice">
          By providing your IBAN and confirming this payment, you’re authorizing
          Payments Demo and Stripe, our payment provider, to send instructions
          to your bank to debit your account. You’re entitled to a refund under
          the terms and conditions of your agreement with your bank.
        </p>
      </div>
      <div className="payment-info ideal">
        <fieldset>
          <label>
            <span>iDEAL Bank</span>
            <div id="ideal-bank-element"></div>
          </label>
        </fieldset>
      </div>
      <div className="payment-info redirect">
        <p className="notice">
          You’ll be redirected to the banking site to complete your payment.
        </p>
      </div>
      <div className="payment-info receiver">
        <p className="notice">
          Payment information will be provided after you place the order.
        </p>
      </div>
      <div className="payment-info wechat">
        <div id="wechat-qrcode"></div>
        <p className="notice">
          Click the button below to generate a QR code htmlFor WeChat.
        </p>
      </div>
    </section>
  );
};

export default PaymentInformation;
