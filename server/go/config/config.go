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

func PaymentMethods() []string {
	paymentMethodsString := os.Getenv("PAYMENT_METHODS")
	if paymentMethodsString == "" {
		return []string{"card"}
	} else {
		return strings.Split(paymentMethodsString, ", ")
	}
}

func Default() Config {
	stripeCountry := os.Getenv("STRIPE_ACCOUNT_COUNTRY")
	if stripeCountry == "" {
		stripeCountry = "US"
	}

	return Config{
		StripePublishableKey: os.Getenv("STRIPE_PUBLISHABLE_KEY"),
		StripeCountry:        stripeCountry,
		Country:              "US",
		Currency:             "eur",
		PaymentMethods:       PaymentMethods(),
		ShippingOptions:      inventory.ShippingOptions(),
	}
}
