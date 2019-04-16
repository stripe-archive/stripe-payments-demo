package inventory

import (
	"fmt"

	"github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/product"
	"github.com/stripe/stripe-go/sku"
)

type Item struct {
	Parent   string
	Quantity int
}

type Listing struct {
	Data interface{} `json:"data"`
}

func ListProducts() (*Listing, error) {
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

	return &Listing{products}, nil
}

func ListSKUs(productID string) (*Listing, error) {
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

	return &Listing{skus}, nil

}

func CalculatePaymentAmount(items []Item) (int, error) {
	return 0, nil
}
