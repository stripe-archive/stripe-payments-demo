package config

import (
	"os"
	"strings"

	"github.com/stripe/stripe-payments-demo/inventory"
)

type Config struct {
	StripePublishableKey string   `json:"stripePublishableKey"`
	StripeCountry        string   `json:"stripeCountry"`
	Country              string   `json:"country"`
	Currency             string   `json:"currency"`
	PaymentMethods       []string `json:"paymentMethods"`

	ShippingOptions []inventory.ShippingOption `json:"shippingOptions"`
}

func Default() Config {
	stripeCountry := os.Getenv("STRIPE_ACCOUNT_COUNTRY")
	if stripeCountry == "" {
		stripeCountry = "US"
	}

	paymentMethodsString := os.Getenv("PAYMENT_METHODS")
	var paymentMethods []string
	if paymentMethodsString == "" {
		paymentMethods = []string{"card"}
	} else {
		paymentMethods = strings.Split(paymentMethodsString, ", ")
	}

	return Config{
		StripePublishableKey: os.Getenv("STRIPE_PUBLISHABLE_KEY"),
		StripeCountry:        stripeCountry,
		Country:              "US",
		Currency:             "eur",
		PaymentMethods:       paymentMethods,
		ShippingOptions:      inventory.ShippingOptions(),
	}
}
