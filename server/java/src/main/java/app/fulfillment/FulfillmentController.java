package app.fulfillment;

import spark.Request;
import spark.Response;
import spark.Route;

public class FulfillmentController {

    public static Route webhookReceived = (Request request, Response response) -> {

        String payload = request.body();
        String header = request.headers("Stripe-Signature");

        Fulfillment.fulfill(Fulfillment.verifyAndReturn(payload, header));

        response.status(200);
        response.type("application/json");
        return response;
    };
}
