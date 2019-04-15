package app.payment;

import com.stripe.model.PaymentIntent;
import com.stripe.net.ApiResource;
import com.google.gson.Gson;
import spark.Request;
import spark.Response;
import spark.Route;

import java.util.HashMap;
import java.util.Map;

public class PaymentController {
    public static Route createPaymentIntent = (Request request, Response response) -> {

        String requestBody = request.body();

        Basket basket = ApiResource.GSON.fromJson(requestBody, Basket.class);

        Payment payment = new Payment(basket);

        response.status(200);
        response.type("application/json");
        Map<String, Object> wrapper = new HashMap<String, Object>();
        wrapper.put("paymentIntent", payment.getPaymentIntent());
        return ApiResource.GSON.toJson(wrapper);
    };

    public static Route updatePaymentIntent = (Request request, Response response) -> {

        String requestBody = request.body();
        String paymentIntentId = request.params(":id");

        Basket basket = new Gson().fromJson(requestBody, Basket.class);

        PaymentIntent paymentIntent = Payment.updateShippingCost(paymentIntentId, basket);

        response.status(200);
        response.type("application/json");

        Map<String, Object> wrapper = new HashMap<String, Object>();
        wrapper.put("paymentIntent", paymentIntent);

        return ApiResource.GSON.toJson(wrapper);

    };

    public static Route getPaymentIntent = (Request request, Response response) -> {

        String paymentIntentId = request.params(":id");

        PaymentIntent paymentIntent = Payment.getPaymentIntent(paymentIntentId);

        response.status(200);
        response.type("application/json");

        Map<String, Object> status = new HashMap<>();
        status.put("status", paymentIntent.getStatus());

        Map<String, Object> wrapper = new HashMap<String, Object>();
        wrapper.put("paymentIntent", status);

        return ApiResource.GSON.toJson(wrapper);

    };
}
