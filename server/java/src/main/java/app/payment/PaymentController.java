package app.payment;

import com.google.gson.Gson;
import app.payment.Basket;
import spark.Request;
import spark.Response;
import spark.Route;

import java.util.HashMap;
import java.util.Map;

public class PaymentController {
    public static Route createPaymentIntent = (Request request, Response response) -> {

        String requestBody = request.body();

        Basket basket = new Gson().fromJson(requestBody, Basket.class);

        Payment payment = new Payment(basket);

        response.status(200);
        response.type("application/json");
        Map<String, Object> wrapper = new HashMap<String, Object>();
        wrapper.put("paymentIntent", payment.getPaymentIntent());
        return new Gson().toJson(wrapper);
    };
}
