package app.fulfillment;

import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.net.ApiResource;
import com.google.gson.JsonSyntaxException;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.net.Webhook;
import java.util.*;

public class Fulfillment {

    public static Event verifyAndReturn(String payload, String header) throws JsonSyntaxException, SignatureVerificationException {
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        String endpointSecret = System.getenv("STRIPE_WEBHOOK_SECRET");

        Event event = null;

        if (endpointSecret == null) {
            event = ApiResource.GSON.fromJson(payload, Event.class);
        } else {
            event = Webhook.constructEvent(
                    payload, header, endpointSecret
            );
        }

        return event;
    }

    public static Integer fulfill(Event event) throws StripeException {

        PaymentIntent pi = null;
        Source source = null;
        String paymentIntentId;

        // Switch on the event type to handle the different events we have subscribed to
        switch (event.getType()) {

            // Events where the PaymentIntent has succeeded
            case "payment_intent.succeeded":
                // Get the PaymentIntent out from the event.
                pi = (PaymentIntent) event.getDataObjectDeserializer().getObject();

                // Print a success message
                System.out.println("Webhook received! Payment for PaymentIntent " + pi.getId() + " succeeded");
                break;

            case "payment_intent.payment_failed":
                // Get the PaymentIntent out from the event.
                pi = (PaymentIntent) event.getDataObjectDeserializer().getObject();

                // Print a failure message
                System.out.println("Webhook received! Payment on source "
                        + pi.getLastPaymentError().getSource().getId()
                        + " for PaymentIntent "
                        + pi.getId()
                        + " failed");
                break;

            case "source.chargeable":
                // Get the Source out from the event
                source = (Source) event.getDataObjectDeserializer().getObject();
                System.out.println("Webhook received! The source "
                        + source.getId()
                        + " is chargeable");

                // Attempt to get the PaymentIntent associated with this source
                paymentIntentId = source.getMetadata().get("paymentIntent");

                // If there was no PaymentIntent associated with the source, return a 400
                if (paymentIntentId == null) {
                    System.out.println("Could not find a PaymentIntent in the source.chargeable event "
                            + event.getId());
                    return 400;
                }

                // Get the PaymentIntent
                pi = PaymentIntent.retrieve(source.getMetadata().get("paymentIntent"));

                // If the PaymentIntent already has a source, return a 403
                if (!(pi.getStatus().equals("requires_payment_method"))) {
                    return 403;
                }

                // Confirm the PaymentIntent using the source id
                Map<String, Object> params = new HashMap<String, Object>();
                params.put("source", source.getId());
                pi.confirm(params);

                break;

            case "source.failed":
                // Get the Source out from the event.
                source = (Source) event.getDataObjectDeserializer().getObject();

                // Print a failure message
                System.out.println("The Source "
                        + source.getId()
                        + " failed or timed out.");

                // Attempt to get the PaymentIntent associated with this source
                paymentIntentId = source.getMetadata().get("paymentIntent");

                // If there was no PaymentIntent associated with the source, return a 400
                if (paymentIntentId == null) {
                    System.out.println("Could not find a PaymentIntent in the source.chargeable event "
                            + event.getId());
                    return 400;
                }

                // Get the PaymentIntent
                pi = PaymentIntent.retrieve(source.getMetadata().get("paymentIntent"));

                pi.cancel();

                break;

            case "source.cancelled":
                // Get the Source out from the event.
                source = (Source) event.getDataObjectDeserializer().getObject();

                // Print a failure message
                System.out.println("The Source "
                        + source.getId()
                        + " failed or timed out.");

                // Attempt to get the PaymentIntent associated with this source
                paymentIntentId = source.getMetadata().get("paymentIntent");

                // If there was no PaymentIntent associated with the source, return a 400
                if (paymentIntentId == null) {
                    System.out.println("Could not find a PaymentIntent in the source.chargeable event "
                            + event.getId());
                    return 400;
                }

                // Get the PaymentIntent
                pi = PaymentIntent.retrieve(source.getMetadata().get("paymentIntent"));

                pi.cancel();

            default:
                System.out.print("No case to handle events of type " + event.getType());
        }

        return 200;
    }
}
