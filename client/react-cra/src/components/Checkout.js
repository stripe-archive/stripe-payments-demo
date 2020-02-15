import React from 'react';
import CheckoutForm from './CheckoutForm';
import ErrorContainer from './ErrorContainer';

const Checkout = ({config, cart}) => (
  <div id="checkout">
    {/* <PaymentRequestButton config={config} cart={cart} /> */}
    <CheckoutForm config={config} cart={cart} />
    <ErrorContainer />
  </div>
);

export default Checkout;
