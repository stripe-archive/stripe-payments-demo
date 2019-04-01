package app;

import app.config.ConfigController;
import app.fulfillment.FulfillmentController;
import app.product.ProductController;
import app.payment.PaymentController;

import static spark.Spark.*;

public class Application {

    public static void main(String[] args) {
        port(4567);
        staticFiles.externalLocation("/Users/mikeshaw/scratch/stripe-payments-demo/public");
        staticFiles.expireTime(600L);

        get("/config", ConfigController.getConfig);
        get("/products", ProductController.getProducts);
        get("/product/:id/skus", ProductController.getSKUsForProduct);
        post("/payment_intents", PaymentController.createPaymentIntent);
        post("/webhook", FulfillmentController.webhookReceived);
    }
}
