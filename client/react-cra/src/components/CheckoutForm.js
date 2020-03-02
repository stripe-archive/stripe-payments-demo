import React from 'react';
import BillingInformation from '../components/BillingInformation';
import PaymentInformation from '../components/PaymentInformation';
import {formatAmountForDisplay} from '../utils/helpers';

import {CardElement, useStripe, useElements} from '@stripe/react-stripe-js';

const CheckoutForm = ({config, cart}) => {
  const stripe = useStripe();
  const elements = useElements();

  // Handle new PaymentIntent result
  const handlePayment = paymentResponse => {
    const {paymentIntent, error} = paymentResponse;

    if (error) {
      cart.setStatus({
        class: 'error',
        message: error.message,
      });
    } else if (paymentIntent.status === 'succeeded') {
      cart.setStatus({
        class: 'success',
        message:
          'We just sent your receipt to your email address, and your items will be on their way shortly.',
      });
    } else if (paymentIntent.status === 'processing') {
      cart.setStatus({
        class: 'success',
        message:
          'We’ll send your receipt and ship your items as soon as your payment is confirmed.',
      });
    } else {
      // Payment has failed.
      cart.setStatus({
        class: 'error',
      });
    }
  };

  const handleFormSubmit = async event => {
    // TODO REACTIFY
    // Block native form submission.
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const form = event.target;
    // Retrieve the user information from the form.
    const payment = form.querySelector('input[name=payment]:checked').value;
    const name = form.querySelector('input[name=name]').value;
    const country = form.querySelector('select[name=country] option:checked')
      .value;
    const email = form.querySelector('input[name=email]').value;
    const shipping = {
      name,
      address: {
        line1: form.querySelector('input[name=address]').value,
        city: form.querySelector('input[name=city]').value,
        postal_code: form.querySelector('input[name=postal_code]').value,
        state: form.querySelector('input[name=state]').value,
        country,
      },
    };
    // Disable the Pay button to prevent multiple click events.
    // submitButton.disabled = true;
    // submitButton.textContent = 'Processing…';

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const cardElement = elements.getElement(CardElement);

    if (payment === 'card') {
      // Let Stripe.js handle the confirmation of the PaymentIntent with the card Element.
      const response = await stripe.confirmCardPayment(
        cart.paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name,
            },
          },
          shipping,
        }
      );
      console.log({response});
      handlePayment(response);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleFormSubmit}>
      <BillingInformation config={config} />
      <PaymentInformation />
      <button className="payment-button" type="submit">
        Pay {formatAmountForDisplay(cart?.total, cart?.currency)}
      </button>
    </form>
  );
};

export default CheckoutForm;
