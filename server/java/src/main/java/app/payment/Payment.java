package app.payment;

import com.stripe.exception.StripeException;
import app.inventory.Inventory;
import com.stripe.model.PaymentIntent;
import com.stripe.*;
import java.util.*;

public class Payment {

    private PaymentIntent paymentIntent;

    public Payment(Basket basket) throws StripeException {
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        Map<String, Object> paymentintentParams = new HashMap<String, Object>();
        paymentintentParams.put("amount", Inventory.calculatePaymentAmount(basket.items));
        paymentintentParams.put("currency", basket.currency);
        List<String> payment_method_types = new ArrayList<String>();
        payment_method_types = Arrays.asList(Optional.ofNullable(System.getenv("PAYMENT_METHODS")).orElse("card").split("\\s*,\\s*"));
        paymentintentParams.put(
                "payment_method_types",
                payment_method_types
        );

        this.paymentIntent = PaymentIntent.create(paymentintentParams);
    }

    public PaymentIntent getPaymentIntent() {
        return this.paymentIntent;
    }

    public static PaymentIntent updateShippingCost(String paymentIntentId, Basket basket) throws StripeException {

        Long amount = Inventory.calculatePaymentAmount(basket.items);

        amount += Inventory.getShippingCost(basket.shippingOption.get("id"));

        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

        Map<String, Object> paymentintentParams = new HashMap<String, Object>();
        paymentintentParams.put("amount", amount);

        return paymentIntent.update(paymentintentParams);

    }

    public static PaymentIntent getPaymentIntent(String id) throws StripeException {
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        PaymentIntent paymentIntent = PaymentIntent.retrieve(id);

        return paymentIntent;
    }
}
