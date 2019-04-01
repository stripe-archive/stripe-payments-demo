package app.product;

import app.inventory.Inventory;
import app.seed.Seed;
import com.google.gson.Gson;
import com.stripe.model.ProductCollection;
import com.stripe.model.SkuCollection;
import spark.Request;
import spark.Response;
import spark.Route;
import java.util.*;

public class ProductController {

    public static Route getProducts = (Request request, Response response) -> {

        ProductCollection products = Inventory.listProducts();

        if (products.getData().size() > 0) {
            response.status(200);
            response.type("application/json");
            return new Gson().toJson(products);
        } else {
            Seed.seed();
            products = Inventory.listProducts();
            response.status(200);
            response.type("application/json");
            return new Gson().toJson(products);
        }
    };

    public static Route getSKUsForProduct = (Request request, Response response) -> {

        String productId = request.params(":id");

        SkuCollection skus = Inventory.listSkus(productId);

        response.status(200);
        response.type("application/json");
        return new Gson().toJson(skus);

    };
}
