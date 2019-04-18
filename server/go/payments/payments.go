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

type IntentShippingChangeRequest struct {
	Items          []inventory.Item         `json:"items"`
	ShippingOption inventory.ShippingOption `json:"shippingOption"`
}

func CreateIntent(r *IntentCreationRequest) (*stripe.PaymentIntent, error) {
	amount, err := inventory.CalculatePaymentAmount(r.Items)
	if err != nil {
		return nil, fmt.Errorf("payments: error computing payment amount: %v", err)
	}

	params := &stripe.PaymentIntentParams{
		Amount:             stripe.Int64(amount),
		Currency:           stripe.String(r.Currency),
		PaymentMethodTypes: stripe.StringSlice(config.PaymentMethods()),
	}
	pi, err := paymentintent.New(params)
	if err != nil {
		return nil, fmt.Errorf("payments: error creating payment intent: %v", err)
	}

	return pi, nil
}

func RetrieveIntent(paymentIntent string) (*stripe.PaymentIntent, error) {
	pi, err := paymentintent.Get(paymentIntent, nil)
	if err != nil {
		return nil, fmt.Errorf("payments: error fetching payment intent: %v", err)
	}

	return pi, nil
}

func ConfirmIntent(paymentIntent string, source *stripe.Source) error {
	pi, err := paymentintent.Get(paymentIntent, nil)
	if err != nil {
		return fmt.Errorf("payments: error fetching payment intent for confirmation: %v", err)
	}

	if pi.Status != "requires_payment_method" {
		return fmt.Errorf("payments: PaymentIntent already has a status of %s", pi.Status)
	}

	params := &stripe.PaymentIntentConfirmParams{
		Source: stripe.String(source.ID),
	}
	_, err = paymentintent.Confirm(pi.ID, params)
	if err != nil {
		return fmt.Errorf("payments: error confirming PaymentIntent: %v", err)
	}

	return nil
}

func CancelIntent(paymentIntent string) error {
	_, err := paymentintent.Cancel(paymentIntent, nil)
	if err != nil {
		return fmt.Errorf("payments: error canceling PaymentIntent: %v", err)
	}

	return nil
}

func UpdateShipping(paymentIntent string, r *IntentShippingChangeRequest) (*stripe.PaymentIntent, error) {
	amount, err := inventory.CalculatePaymentAmount(r.Items)
	if err != nil {
		return nil, fmt.Errorf("payments: error computing payment amount: %v", err)
	}

	shippingCost, ok := inventory.GetShippingCost(r.ShippingOption.ID)
	if !ok {
		return nil, fmt.Errorf("payments: no cost found for shipping id %q", r.ShippingOption.ID)
	}
	amount += shippingCost

	params := &stripe.PaymentIntentParams{
		Amount: stripe.Int64(amount),
	}
	pi, err := paymentintent.Update(paymentIntent, params)
	if err != nil {
		return nil, fmt.Errorf("payments: error updating payment intent: %v", err)
	}

	return pi, nil
}
