package payments

import (
	"fmt"

	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/paymentintent"

	"github.com/stripe/stripe-payments-demo/config"
	"github.com/stripe/stripe-payments-demo/inventory"
)

type IntentCreationRequest struct {
	Currency string           `json:"currency"`
	Items    []inventory.Item `json:"items"`
}

func CreateIntent(r *IntentCreationRequest) (*stripe.PaymentIntent, error) {
	amount, err := inventory.CalculatePaymentAmount(r.Items)
	if err != nil {
		return nil, fmt.Errorf("payments: error computing payment amount: %v", err)
	}

	params := &stripe.PaymentIntentParams{
		Amount:             stripe.Int64(amount),
		Currency:           stripe.String(r.Currency),
		PaymentMethodTypes: paymentMethodTypes(),
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		return nil, fmt.Errorf("payments: error creating payment intent: %v", err)
	}

	return pi, nil
}

func paymentMethodTypes() []*string {
	types := config.PaymentMethods()

	out := make([]*string, len(types))
	for i, v := range types {
		out[i] = &v
	}

	return out
}
