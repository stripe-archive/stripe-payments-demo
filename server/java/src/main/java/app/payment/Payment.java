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
        ArrayList payment_method_types = new ArrayList();
        payment_method_types.add("card");
        paymentintentParams.put(
                "payment_method_types",
                Arrays.asList(Optional.ofNullable(System.getenv("PAYMENT_METHODS")).orElse("card").split("\\s*,\\s*"))
        );

        this.paymentIntent = PaymentIntent.create(paymentintentParams);
    }

    public PaymentIntent getPaymentIntent() {
        return this.paymentIntent;
    }
}
