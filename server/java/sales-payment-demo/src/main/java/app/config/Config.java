package app.config;

import app.config.ShippingOptions.*;
import java.util.*;


/**
 * Class to store Config for the Demo
 * @author Michael Shaw
 */
public class Config {
    public String stripePublishableKey;
    public String stripeCountry;
    public String country;
    public String currency;
    public List<String> paymentMethods;
    public List<ShippingOptions> shippingOptions;

    public Config() {
        this.stripePublishableKey = System.getenv("STRIPE_PUBLISHABLE_KEY");
        this.stripeCountry = Optional.ofNullable(System.getenv("STRIPE_ACCOUNT_COUNTRY")).orElse("US");
        this.country = "US";
        this.currency = "eur";
        this.paymentMethods = Arrays.asList(Optional.ofNullable(System.getenv("PAYMENT_METHODS")).orElse("card").split("\\s*,\\s*"));
        this.shippingOptions = new ArrayList<ShippingOptions>();

        ShippingOptions option1 = new ShippingOptions();
        option1.id = "free";
        option1.label = "Free Shipping";
        option1.detail = "Delivery within 5 days";
        option1.amount = 0;

        this.shippingOptions.add(option1);

        ShippingOptions option2 = new ShippingOptions();
        option2.id = "express";
        option2.label = "Express Shipping";
        option2.detail = "Next day delivery";
        option2.amount = 500;

        this.shippingOptions.add(option2);
    }
}
