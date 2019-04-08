package app.config;

import com.google.gson.*;
import spark.*;

public class ConfigController {

    public static Route getConfig = (Request request, Response response) -> {

        Config config = new Config();

        response.status(200);
        response.type("application/json");

        // Return as camel case as JS is expecting that
        return new Gson().toJson(config);
    };
}
