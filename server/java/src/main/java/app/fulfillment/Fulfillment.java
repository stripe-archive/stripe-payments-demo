package app.fulfillment;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;

public class Fulfillment {

    public static Event verifyAndReturn(String payload, String header) throws JsonSyntaxException, SignatureVerificationException {
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        String endpointSecret = System.getenv("STRIPE_WEBHOOK_SECRET");

        Event event = null;

        if (endpointSecret == null) {
            event = new Gson().fromJson(payload, Event.class);
        } else {
            event = Webhook.constructEvent(
                    payload, header, endpointSecret
            );
        }

        return event;
    }

    public static String fulfill(Event event) {
        switch (event.getType()) {
            case "payment_intent.succeeded":
                System.out.println(event);
                PaymentIntent pi = (PaymentIntent) event.getDataObjectDeserializer().getObject();
                System.out.println(pi);
//                PaymentIntent paymentIntent = new Gson().fromJson(stripeObject.toJson(), PaymentIntent.class);
                return "Webhook received! Payment for PaymentIntent " + pi.getId() + " succeeded";
            default: return "bar";
        }
    }
}
