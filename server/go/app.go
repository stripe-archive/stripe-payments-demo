package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path"

	"github.com/joho/godotenv"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/labstack/gommon/log"
	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/webhook"

	"github.com/stripe/stripe-payments-demo/config"
	"github.com/stripe/stripe-payments-demo/inventory"
	"github.com/stripe/stripe-payments-demo/payments"
	"github.com/stripe/stripe-payments-demo/setup"
	"github.com/stripe/stripe-payments-demo/webhooks"
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

type listing struct {
	Data interface{} `json:"data"`
}

func buildEcho(publicDirectory string) *echo.Echo {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Logger.SetLevel(log.DEBUG)

	e.File("/", path.Join(publicDirectory, "index.html"))
	e.File("/.well-known/apple-developer-merchantid-domain-association", path.Join(publicDirectory, ".well-known/apple-developer-merchantid-domain-association"))
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

		if !setup.ExpectedProductsExist(products) {
			err := setup.CreateData()
			if err != nil {
				return err
			}

			products, err = inventory.ListProducts()
			if err != nil {
				return err
			}
		}

		return c.JSON(http.StatusOK, listing{products})
	})

	e.GET("/products/:product_id/skus", func(c echo.Context) error {
		skus, err := inventory.ListSKUs(c.Param("product_id"))
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, listing{skus})
	})

	e.GET("/products/:product_id", func(c echo.Context) error {
		product, err := inventory.RetrieveProduct(c.Param("product_id"))
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, product)
	})

	e.POST("/payment_intents", func(c echo.Context) error {
		r := new(payments.IntentCreationRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		pi, err := payments.CreateIntent(r)
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, map[string]*stripe.PaymentIntent{
			"paymentIntent": pi,
		})
	})

	e.POST("/payment_intents/:id/shipping_change", func(c echo.Context) error {
		r := new(payments.IntentShippingChangeRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		pi, err := payments.UpdateShipping(c.Param("id"), r)
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, map[string]*stripe.PaymentIntent{
			"paymentIntent": pi,
		})
	})

	type PaymentIntentsStatusData struct {
		Status           string `json:"status"`
		LastPaymentError string `json:"last_payment_error,omitempty"`
	}

	type PaymentIntentsStatus struct {
		PaymentIntent PaymentIntentsStatusData `json:"paymentIntent"`
	}
	e.POST("/payment_intents/:id/update_currency", func(c echo.Context) error {
		r := new(payments.IntentCurrencyPaymentMethodsChangeRequest)
		err := c.Bind(r)
		if err != nil {
			return err
		}

		pi, err := payments.UpdateCurrencyPaymentMethod(c.Param("id"), r)
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, map[string]*stripe.PaymentIntent{
			"paymentIntent": pi,
		})
	})

	type PaymentIntentsStatusData struct {
		Status           string `json:"status"`
		LastPaymentError string `json:"last_payment_error,omitempty"`
	}

	type PaymentIntentsStatus struct {
		PaymentIntent PaymentIntentsStatusData `json:"paymentIntent"`
	}

	e.GET("/payment_intents/:id/status", func(c echo.Context) error {
		pi, err := payments.RetrieveIntent(c.Param("id"))
		if err != nil {
			return err
		}

		p := PaymentIntentsStatus{
			PaymentIntent: PaymentIntentsStatusData{
				Status: string(pi.Status),
			},
		}
		if pi.LastPaymentError != nil {
			p.PaymentIntent.LastPaymentError = pi.LastPaymentError.Message
		}

		return c.JSON(http.StatusOK, p)
	})

	e.POST("/webhook", func(c echo.Context) error {
		request := c.Request()
		payload, err := ioutil.ReadAll(request.Body)
		if err != nil {
			return err
		}

		var event stripe.Event

		webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
		if webhookSecret != "" {
			event, err = webhook.ConstructEvent(payload, request.Header.Get("Stripe-Signature"), webhookSecret)
			if err != nil {
				return err
			}
		} else {
			err := json.Unmarshal(payload, &event)
			if err != nil {
				return err
			}
		}

		objectType := event.Data.Object["object"].(string)

		var handled bool
		switch objectType {
		case "payment_intent":
			var pi *stripe.PaymentIntent
			err = json.Unmarshal(event.Data.Raw, &pi)
			if err != nil {
				return err
			}

			handled, err = webhooks.HandlePaymentIntent(event, pi)
		case "source":
			var source *stripe.Source
			err := json.Unmarshal(event.Data.Raw, &source)
			if err != nil {
				return err
			}

			handled, err = webhooks.HandleSource(event, source)
		}

		if err != nil {
			return err
		}

		if !handled {
			fmt.Printf("🔔  Webhook received and not handled! %s\n", event.Type)
		}

		return nil
	})

	return e
}
