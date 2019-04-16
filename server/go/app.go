package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"path"

	"github.com/joho/godotenv"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/labstack/gommon/log"
	"github.com/stripe/stripe-go"

	"github.com/stripe/stripe-payments-demo/config"
	"github.com/stripe/stripe-payments-demo/inventory"
)

func main() {
	rootDirectory := flag.String("root-directory", "", "Root directory of the stripe-payments-demo repository")
	flag.Parse()

	if *rootDirectory == "" {
		panic("-root-directory is a required argument")
	}

	err := godotenv.Load(path.Join(*rootDirectory, ".env"))
	if err != nil {
		panic(fmt.Sprintf("error loading .env: %v", err))
	}

	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	if stripe.Key == "" {
		panic("STRIPE_SECRET_KEY must be in environment")
	}

	publicDirectory := path.Join(*rootDirectory, "public")
	e := buildEcho(publicDirectory)
	e.Logger.Fatal(e.Start(":4567"))
}

func buildEcho(publicDirectory string) *echo.Echo {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Logger.SetLevel(log.DEBUG)

	e.File("/", path.Join(publicDirectory, "index.html"))
	e.Static("/javascripts", path.Join(publicDirectory, "javascripts"))
	e.Static("/stylesheets", path.Join(publicDirectory, "stylesheets"))
	e.Static("/images", path.Join(publicDirectory, "images"))

	e.GET("/config", func(c echo.Context) error {
		return c.JSON(http.StatusOK, config.Default())
	})

	e.GET("/products", func(c echo.Context) error {
		products, err := inventory.ListProducts()
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, products)
	})

	e.GET("/product/:product_id/skus", func(c echo.Context) error {
		skus, err := inventory.ListSKUs(c.Param("product_id"))
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, skus)
	})

	return e
}
