const googlePay = config => {
  /**
   * Define the version of the Google Pay API referenced when creating your
   * configuration
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/object#PaymentDataRequest|apiVersion in PaymentDataRequest}
   */
  const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
  };
  /**
   * Card networks supported by your site and your gateway
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/object#CardParameters|CardParameters}
   * @todo confirm card networks supported by your site and gateway
   */
  const allowedCardNetworks = ['AMEX', 'MASTERCARD', 'VISA'];
  /**
   * Card authentication methods supported by your site and your gateway
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/object#CardParameters|CardParameters}
   * @todo confirm your processor supports Android device tokens for your
   * supported card networks
   */
  const allowedCardAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];
  /**
   * Identify your gateway and your site's gateway merchant identifier
   *
   * The Google Pay API response will return an encrypted payment method capable
   * of being charged by a supported gateway after payer authorization
   *
   * @todo check with your gateway on the parameters to pass
   * @see {@link https://developers.google.com/pay/api/web/reference/object#Gateway|PaymentMethodTokenizationSpecification}
   */
  const tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
      gateway: 'stripe',
      'stripe:version': '2018-09-24', // TODO config.stripeVersion,
      'stripe:publishableKey': config.stripePublishableKey,
    },
  };
  /**
   * Describe your site's support for the CARD payment method and its required
   * fields
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/object#CardParameters|CardParameters}
   */
  const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
      allowedAuthMethods: allowedCardAuthMethods,
      allowedCardNetworks: allowedCardNetworks,
      billingAddressRequired: true, // TODO put in config
      billingAddressParameters: {
        format: 'MIN',
        phoneNumberRequired: true,
      },
    },
  };
  /**
   * Describe your site's support for the CARD payment method including optional
   * fields
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/object#CardParameters|CardParameters}
   */
  const cardPaymentMethod = Object.assign(
    // TODO destructure instead of assign
    {},
    baseCardPaymentMethod,
    {
      tokenizationSpecification: tokenizationSpecification,
    }
  );
  /**
   * An initialized google.payments.api.PaymentsClient object
   *
   * @see {@link getGooglePaymentsClient}
   */
  const paymentsClient = new window.google.payments.api.PaymentsClient({
    environment: 'TEST',
  });

  /**
   * Configure support for the Google Pay API
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/object#PaymentDataRequest|PaymentDataRequest}
   * @returns {object} PaymentDataRequest fields
   */
  const getGooglePaymentDataRequest = () => {
    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = {
      // @todo a merchant ID is available for a production environment after approval by Google
      // See {@link https://developers.google.com/pay/api/web/guides/test-and-deploy/integration-checklist|Integration checklist}
      // merchantId: '01234567890123456789',
      merchantName: 'Example Merchant',
    };
    paymentDataRequest.emailRequired = true;
    paymentDataRequest.shippingAddressRequired = true;
    paymentDataRequest.shippingAddressParameters = getShippingAddressParams();
    return paymentDataRequest;
  };

  const getShippingAddressParams = () => {
    // set restrictions for allowed shipping regions based on merchant admin configuration
    // https://developers.google.com/pay/api/web/reference/object#ShippingAddressParameters
    return {
      allowedCountryCodes: ['US'], // TODO config
    };
  };

  /**
   * Provide Google Pay API with a payment amount, currency, and amount status
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/object#TransactionInfo|TransactionInfo}
   * @returns {object} transaction info, suitable for use as transactionInfo property of PaymentDataRequest
   */
  const getGoogleTransactionInfo = () => {
    // TODO use basket info
    return {
      currencyCode: 'USD',
      totalPriceStatus: 'FINAL',
      // set to cart total
      totalPrice: '1.00',
    };
  };

  /**
   * Prefetch payment data to improve performance
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/client#prefetchPaymentData|prefetchPaymentData()}
   */
  const prefetchGooglePaymentData = () => {
    const paymentDataRequest = getGooglePaymentDataRequest();
    // transactionInfo must be set but does not affect cache
    paymentDataRequest.transactionInfo = {
      totalPriceStatus: 'NOT_CURRENTLY_KNOWN',
      currencyCode: 'USD', // TODO pull from config
    };
    paymentsClient.prefetchPaymentData(paymentDataRequest);
  };

  /**
   * Process payment data returned by the Google Pay API
   *
   * @param {object} paymentData response from Google Pay API after shopper approves payment
   * @see {@link https://developers.google.com/pay/api/web/reference/object#PaymentData|PaymentData object reference}
   */
  const processPayment = (paymentData, callback) => {
    console.log({paymentData}); // show returned data in developer console for debugging
    const stripeToken = JSON.parse(
      paymentData.paymentMethodData.tokenizationData.token
    ).id;
    callback({token: {id: stripeToken}});
  };

  /**
   * Show Google Pay payment sheet when Google Pay payment button is clicked
   */
  const onGooglePaymentButtonClicked = callback => {
    const paymentDataRequest = getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentsClient
      .loadPaymentData(paymentDataRequest)
      .then(paymentData => {
        // handle the response
        processPayment(paymentData, callback);
      })
      .catch(error => {
        callback({error});
      });
  };

  return {
    /**
     * Configure your site's support for payment methods supported by the Google Pay
     * API.
     *
     * Each member of allowedPaymentMethods should contain only the required fields,
     * allowing reuse of this base request when determining a viewer's ability
     * to pay and later requesting a supported payment method
     *
     * @returns {object} Google Pay API version, payment methods supported by the site
     */
    getGoogleIsReadyToPayRequest: () => {
      return Object.assign({}, baseRequest, {
        allowedPaymentMethods: [baseCardPaymentMethod],
        existingPaymentMethodRequired: true,
      });
    },

    /**
     * Return an active PaymentsClient or initialize
     *
     * @see {@link https://developers.google.com/pay/api/web/reference/client#PaymentsClient|PaymentsClient constructor}
     * @returns {google.payments.api.PaymentsClient} Google Pay API client
     */
    getGooglePaymentsClient: () => {
      return paymentsClient;
    },

    /**
     * Add a Google Pay purchase button alongside an existing checkout button
     *
     * @see {@link https://developers.google.com/pay/api/web/reference/object#ButtonOptions|Button options}
     * @see {@link https://developers.google.com/pay/api/web/guides/brand-guidelines|Google Pay brand guidelines}
     */
    addGooglePayButton: (
      elementId,
      callback,
      options = {buttonColor: 'black', buttonType: 'long'}
    ) => {
      const button = paymentsClient.createButton({
        onClick: () => onGooglePaymentButtonClicked(callback),
        buttonColor: options.buttonColor,
        buttonType: options.buttonType,
      });
      document.getElementById(elementId).appendChild(button);
    },
  };
};

export default googlePay;
