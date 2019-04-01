class Tracer {
  static SetupTracingConfig(store) {
    this.store = store;
    const demoConfig = store.getDemoConfig();
    if (!demoConfig['aquarium-id']) {
      // create simple random tracer id
      let aquariumId = '';
      let possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      for (var i = 0; i < 5; i++)
        aquariumId += possible.charAt(
          Math.floor(Math.random() * possible.length)
        );

      store.updateConfig({'aquarium-id': aquariumId});
    }
    document.getElementById(
      'tracer-link'
    ).href = `https://stripe-tracer.com?aquarium-id=${
      demoConfig['aquarium-id']
    }`;
  }
  static async TraceStripe(stripe) {
    const demoConfig = store.getDemoConfig();
    const tracer = new aquarium.Aquarium({
      subjectName: 'stripejs',
      applicationName: 'stripe-payments-demo-public',
    });
    let collector = new aquarium.PusherClientCollector(
      demoConfig['aquarium-id']
    );
    await tracer.setCollector(collector);
    stripe.confirmPaymentIntent = tracer.watchAction({
      actionFunction: stripe.confirmPaymentIntent,
      name: 'confirmPaymentIntent',
      metadata: {
        description:
          'Confirms the payment intent from the client-side using the payment intent public secret',
        docUrl: 'https://stripe.com/docs/api/payment_intents/confirm',
      },
    });
    stripe.handleCardPayment = tracer.watchAction({
      actionFunction: stripe.handleCardPayment,
      name: 'handleCardPayment',
      metadata: {
        description:
          'Stripe.js handles the card payment. If 3dsv2 is required Stripe.js automatically handles the authentication within an IFrame on your page.',
        docUrl:
          'https://stripe.com/docs/stripe-js/reference#stripe-handle-card-payment',
      },
      options: {
        argsTransformer: ({name, args}) => {
          const paymentIntentId = args[0];
          return [paymentIntentId, '[cardElement] object'];
        },
      },
    });
    stripe.createSource = tracer.watchAction({
      actionFunction: stripe.createSource,
      name: 'createSource',
      metadata: {
        description:
          'Stripe.js creates a new source that can be used with PaymentIntents or Charges.',
        docUrl:
          'https://stripe.com/docs/stripe-js/reference#stripe-create-source',
      },
      options: {
        argsTransformer: ({name, args}) => {
          // inject tracing metadata for webhooks
          if (args[1]) {
            if (!args[1].metadata) {
              args[1].metadata = {};
            }
            Object.assign(args[1].metadata, {
              _aquarium_id: demoConfig['aquarium-id'],
              _aquarium_application: tracer.applicationName,
            });
          } else if (args[0]) {
            if (!args[0].metadata) {
              args[1].metadata = {};
            }
            Object.assign(args[0].metadata, {
              _aquarium_id: demoConfig['aquarium-id'],
              _aquarium_application: tracer.applicationName,
            });
          }
          return ['[cardElement] object', args[1]];
        },
      },
    });
  }
}

window.Tracer = Tracer;
