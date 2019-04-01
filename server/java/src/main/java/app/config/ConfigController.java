package app.config;

import com.google.gson.Gson;
import app.config.Config;
import spark.*;

public class ConfigController {

    public static Route getConfig = (Request request, Response response) -> {

        Config config = new Config();

        response.status(200);
        response.type("application/json");
        return new Gson().toJson(config);
    };
}
