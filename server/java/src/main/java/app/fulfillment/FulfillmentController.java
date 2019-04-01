package app.fulfillment;

import com.stripe.net.ApiResource;
import spark.Request;
import spark.Response;
import spark.Route;

public class FulfillmentController {

    public static Route webhookReceived = (Request request, Response response) -> {

        String payload = request.body();
        String header = request.headers("Stripe-Signature");

        Integer responseCode = Fulfillment.fulfill(Fulfillment.verifyAndReturn(payload, header));

        String message;

        if (responseCode == 200) {
            message = "success";
        } else {
            message = "failure";
        }

        response.status(responseCode);
        response.type("application/json");
        return ApiResource.GSON.toJson(message);
    };
}
