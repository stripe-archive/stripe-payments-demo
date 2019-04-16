package inventory

import (
	"fmt"

	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/product"
	"github.com/stripe/stripe-go/sku"
)

type Item struct {
	Parent   string `json:"parent"`
	Quantity int64  `json:"quantity"`
}

func ListProducts() ([]*stripe.Product, error) {
	products := []*stripe.Product{}

	params := &stripe.ProductListParams{}
	params.Filters.AddFilter("limit", "", "3")
	i := product.List(params)
	for i.Next() {
		products = append(products, i.Product())
	}

	err := i.Err()
	if err != nil {
		return nil, fmt.Errorf("inventory: error listing products: %v", err)
	}

	return products, nil
}

func RetrieveProduct(productID string) (*stripe.Product, error) {
	return product.Get(productID, nil)
}

func ListSKUs(productID string) ([]*stripe.SKU, error) {
	skus := []*stripe.SKU{}

	params := &stripe.SKUListParams{}
	params.Filters.AddFilter("limit", "", "1")
	i := sku.List(params)
	for i.Next() {
		skus = append(skus, i.SKU())
	}

	err := i.Err()
	if err != nil {
		return nil, fmt.Errorf("inventory: error listing SKUs: %v", err)
	}

	return skus, nil

}

func CalculatePaymentAmount(items []Item) (int64, error) {
	total := int64(0)
	for _, item := range items {
		sku, err := sku.Get(item.Parent, nil)
		if err != nil {
			return 0, fmt.Errorf("inventory: error getting SKU for price: %v", err)
		}
		total += sku.Price * item.Quantity
	}
	return total, nil
}
