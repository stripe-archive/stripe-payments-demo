package app;

import app.config.ConfigController;
import app.fulfillment.FulfillmentController;
import app.product.ProductController;
import app.payment.PaymentController;

import static spark.Spark.*;

public class Application {

    public static void main(String[] args) {
        port(4567);
        staticFiles.externalLocation("../../public");
        staticFiles.expireTime(600L);

        get("/config", ConfigController.getConfig);
        get("/products", ProductController.getProducts);
        get("/products/:id", ProductController.getProduct);
        get("/product/:id/skus", ProductController.getSKUsForProduct);
        get("/payment_intents/:id/status", PaymentController.getPaymentIntent);
        post("/payment_intents", PaymentController.createPaymentIntent);
        post("/payment_intents/:id/shipping_change", PaymentController.updatePaymentIntent);
        post("/webhook", FulfillmentController.webhookReceived);
    }
}