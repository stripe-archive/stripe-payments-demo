package app.inventory;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Product;
import com.stripe.model.Sku;
import com.stripe.model.ProductCollection;
import com.stripe.model.SkuCollection;
import sun.reflect.generics.reflectiveObjects.NotImplementedException;

import java.util.*;


public class Inventory {

    public static Long calculatePaymentAmount(ArrayList<Map> items) throws StripeException {
        // Get the Stripe Key
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        Long total = 0L;
        Integer quantity = 0;

        for (Map product: items) {
            Sku sku = Sku.retrieve(product.get("parent").toString());
            quantity = ((Double) product.get("quantity")).intValue();
            total += sku.getPrice() * quantity;
        }

        return total;
    }

    public static Long getShippingCost(String id) {
        if (id.equals("free")) {
            return 0L;
        } else if (id.equals("express")) {
            return 500L;
        } else {
            return 0L;
        }
    }

    public static SkuCollection listSkus(String productId) throws StripeException{
        // Get the Stripe Key
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        Map<String, Object> skuParams = new HashMap<String, Object>();
        skuParams.put("product", productId);
        skuParams.put("limit", "3");

        SkuCollection collection = Sku.list(skuParams);

        return collection;
    }

    public static ProductCollection listProducts() throws StripeException{
        // Get the Stripe Key
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        Map<String, Object> productParams = new HashMap<String, Object>();
        productParams.put("limit", "3");

        ProductCollection collection = Product.list(productParams);

        return collection;
    }

    public static Product retrieveProduct(String id) throws StripeException {
        // Get the Stripe Key
        Stripe.apiKey = System.getenv("STRIPE_SECRET_KEY");

        return Product.retrieve(id);
    }
}
