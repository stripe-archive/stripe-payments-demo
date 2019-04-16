package inventory

type ShippingOption struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Detail string `json:"detail"`
	Amount int    `json:"amount"`
}

func ShippingOptions() []ShippingOption {
	return []ShippingOption{
		{
			ID:     "free",
			Label:  "Free Shipping",
			Detail: "Delivery within 5 days",
			Amount: 0,
		},
		{
			ID:     "express",
			Label:  "Express Shipping",
			Detail: "Next day delivery",
			Amount: 500,
		},
	}
}
