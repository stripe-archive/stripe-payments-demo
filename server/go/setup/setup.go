package setup

import (
	"fmt"

	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/product"
	"github.com/stripe/stripe-go/sku"
)

func CreateData() error {
	err := createProducts()
	if err != nil {
		return fmt.Errorf("setup: error creating products: %v", err)
	}

	err = createSKUs()
	if err != nil {
		return fmt.Errorf("setup: error creating products: %v", err)
	}

	return nil
}

func ExpectedProductsExist(existingProducts []*stripe.Product) bool {
	expectedProductIDs := []string{"increment", "shirt", "pins"}

	if len(expectedProductIDs) != len(existingProducts) {
		return false
	}

	existingProductIDs := map[string]bool{}
	for _, product := range existingProducts {
		existingProductIDs[product.ID] = true
	}

	for _, productID := range expectedProductIDs {
		if !existingProductIDs[productID] {
			return false
		}
	}

	return true
}

func createProducts() error {
	paramses := []*stripe.ProductParams{
		{
			ID:   stripe.String("increment"),
			Type: stripe.String(string(stripe.ProductTypeGood)),
			Name: stripe.String("Increment Magazine"),
			Attributes: []*string{
				stripe.String("issue"),
			},
		},
		{
			ID:   stripe.String("pins"),
			Type: stripe.String(string(stripe.ProductTypeGood)),
			Name: stripe.String("Stripe Pins"),
			Attributes: []*string{
				stripe.String("set"),
			},
		},
		{
			ID:   stripe.String("shirt"),
			Type: stripe.String(string(stripe.ProductTypeGood)),
			Name: stripe.String("Stripe Shirt"),
			Attributes: []*string{
				stripe.String("size"),
				stripe.String("gender"),
			},
		},
	}

	for _, params := range paramses {
		_, err := product.New(params)
		if err != nil {
			stripeErr, ok := err.(*stripe.Error)
			if ok && stripeErr.Code == "resource_already_exists" {
				// This is fine — we expect this to be idempotent.
			} else {
				return err
			}
		}
	}

	return nil
}

func createSKUs() error {
	paramses := []*stripe.SKUParams{
		{
			ID:      stripe.String("increment-03"),
			Product: stripe.String("increment"),
			Attributes: map[string]string{
				"issue": "Issue #3 “Development”",
			},
			Price:    stripe.Int64(399),
			Currency: stripe.String(string(stripe.CurrencyUSD)),
			Inventory: &stripe.InventoryParams{
				Type: stripe.String(string(stripe.SKUInventoryTypeInfinite)),
			},
		},
		{
			ID:      stripe.String("shirt-small-woman"),
			Product: stripe.String("shirt"),
			Attributes: map[string]string{
				"size":   "Small Standard",
				"gender": "Woman",
			},
			Price:    stripe.Int64(999),
			Currency: stripe.String(string(stripe.CurrencyUSD)),
			Inventory: &stripe.InventoryParams{
				Type: stripe.String(string(stripe.SKUInventoryTypeInfinite)),
			},
		},
		{
			ID:      stripe.String("pins-collector"),
			Product: stripe.String("pins"),
			Attributes: map[string]string{
				"set": "Collector Set",
			},
			Price:    stripe.Int64(799),
			Currency: stripe.String(string(stripe.CurrencyUSD)),
			Inventory: &stripe.InventoryParams{
				Quantity: stripe.Int64(500),
				Type:     stripe.String(string(stripe.SKUInventoryTypeFinite)),
			},
		},
	}

	for _, params := range paramses {
		_, err := sku.New(params)
		if err != nil {
			stripeErr, ok := err.(*stripe.Error)
			if ok && stripeErr.Code == "resource_already_exists" {
				// This is fine — we expect this to be idempotent.
			} else {
				return err
			}
		}
	}

	return nil
}
