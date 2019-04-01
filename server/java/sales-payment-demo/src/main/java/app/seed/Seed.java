package app.seed;

import com.stripe.*;
import com.stripe.exception.InvalidRequestException;
import com.stripe.model.Product;
import com.stripe.model.Sku;
import com.stripe.exception.StripeException;
import java.util.*;

public class Seed {
    public static void seed() throws StripeException{
        try {
            Seed.seedProducts();
        } catch (InvalidRequestException e) {
            System.out.println("Products already exist.");
        }
        try {
            Seed.seedSKUs();
        } catch (InvalidRequestException e) {
            System.out.println("SKUs already exist.");
        }
    }

    private static void seedProducts() throws StripeException {
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        List<Map> productsToAdd = new ArrayList<Map>();

        //Add Increment Magazine
        Map<String, Object> incrementMagazine = new HashMap<String, Object>();
        incrementMagazine.put("id", "increment");
        incrementMagazine.put("type", "good");
        incrementMagazine.put("name", "Increment Magazine");
        ArrayList incAttrs = new ArrayList();
        incAttrs.add("issue");
        incrementMagazine.put("attributes", incAttrs);

        productsToAdd.add(incrementMagazine);

        //Add Stripe Pins
        Map<String, Object> stripePins = new HashMap<String, Object>();
        stripePins.put("id", "pins");
        stripePins.put("type", "good");
        stripePins.put("name", "Stripe Pins");
        ArrayList pinsAttrs = new ArrayList();
        pinsAttrs.add("set");
        stripePins.put("attributes", pinsAttrs);

        productsToAdd.add(stripePins);

        //Add Stripe Pins
        Map<String, Object> stripeShirt = new HashMap<String, Object>();
        stripeShirt.put("id", "shirt");
        stripeShirt.put("type", "good");
        stripeShirt.put("name", "Stripe Shirt");
        ArrayList shirtAttrs = new ArrayList();
        shirtAttrs.add("size");
        shirtAttrs.add("gender");
        stripeShirt.put("attributes", shirtAttrs);

        productsToAdd.add(stripeShirt);

        for (Map product: productsToAdd) {
            Product.create(product);
        }
    }

    private static void seedSKUs() throws StripeException{
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        List<Map> skusToAdd = new ArrayList<Map>();

        //Increment Magazine
        Map<String, Object> incrementSkuParams = new HashMap<String, Object>();
        incrementSkuParams.put("id", "increment-03");
        incrementSkuParams.put("product", "increment");
        incrementSkuParams.put("price", 399);
        incrementSkuParams.put("currency", "usd");
        Map<String, Object> incrementAttrParams = new HashMap<String, Object>();
        incrementAttrParams.put("issue", "Issue #3 “Development”");
        incrementSkuParams.put("attributes", incrementAttrParams);
        Map<String, Object> incrementParams = new HashMap<String, Object>();
        incrementParams.put("type", "infinite");
        incrementSkuParams.put("inventory", incrementParams);

        skusToAdd.add(incrementSkuParams);

        //Stripe Pin
        Map<String, Object> pinsSkuParams = new HashMap<String, Object>();
        pinsSkuParams.put("id", "pins-collector");
        pinsSkuParams.put("product", "pins");
        pinsSkuParams.put("price", 799);
        pinsSkuParams.put("currency", "usd");
        Map<String, Object> pinsAttrParams = new HashMap<String, Object>();
        pinsAttrParams.put("set", "Collector Set");
        pinsSkuParams.put("attributes", pinsAttrParams);
        Map<String, Object> pinsParams = new HashMap<String, Object>();
        pinsParams.put("type", "finite");
        pinsParams.put("quantity", 500);
        pinsSkuParams.put("inventory", pinsParams);

        skusToAdd.add(pinsSkuParams);

        //Stripe Shirt
        Map<String, Object> shirtSkuParams = new HashMap<String, Object>();
        shirtSkuParams.put("id", "shirt-small-woman");
        shirtSkuParams.put("product", "shirt");
        shirtSkuParams.put("price", 999);
        shirtSkuParams.put("currency", "usd");
        Map<String, Object> shirtAttrParams = new HashMap<String, Object>();
        shirtAttrParams.put("size", "Small Standard");
        shirtAttrParams.put("gender", "Woman");
        shirtSkuParams.put("attributes", shirtAttrParams);
        Map<String, Object> shirtParams = new HashMap<String, Object>();
        shirtParams.put("type", "infinite");
        shirtSkuParams.put("inventory", shirtParams);

        skusToAdd.add(shirtSkuParams);

        for (Map sku: skusToAdd) {
            Sku.create(sku);
        }
    }
}
