/**
 * store.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * Representation of products, line items, and orders, and saving them on Stripe.
 * Please note this is overly simplified class for demo purposes (all products
 * are loaded for convenience, there is no cart management functionality, etc.).
 * A production app would need to handle this very differently.
 */

class Store {
  constructor() {
    this.lineItems = [];
    this.products = {};
    this.displayOrderSummary();
  }

  // Compute the total for the order based on the line items (SKUs and quantity).
  getOrderTotal() {
    return Object.values(this.lineItems).reduce(
      (total, {product, sku, quantity}) =>
        total + quantity * this.products[product].skus.data[0].price,
      0
    );
  }

  // Expose the line items for the order (in a way that is friendly to the Stripe Orders API).
  getOrderItems() {
    let items = [];
    this.lineItems.forEach(item =>
      items.push({
        type: 'sku',
        parent: item.sku,
        quantity: item.quantity,
      })
    );
    return items;
  }

  // Retrieve the configuration from the API.
  async getConfig() {
    try {
      const response = await fetch('/config');
      const config = await response.json();
      if (config.stripePublishableKey.includes('live')) {
        // Hide the demo notice if the publishable key is in live mode.
        document.querySelector('#order-total .demo').style.display = 'none';
      }
      return config;
    } catch (err) {
      return {error: err.message};
    }
  }

  // Load the product details.
  async loadProducts() {
    const productsResponse = await fetch('/products');
    const products = (await productsResponse.json()).data;
    products.forEach(product => (this.products[product.id] = product));
  }

  // Create an order object to represent the line items.
  async createOrder(currency, items, email, shipping) {
    try {
      const response = await fetch('/orders', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          currency,
          items,
          email,
          shipping,
        }),
      });
      const data = await response.json();
      if (data.error) {
        return {error: data.error};
      } else {
        // Save the current order locally to lookup its status later.
        this.setActiveOrderId(data.order.id);
        return data.order;
      }
    } catch (err) {
      return {error: err.message};
    }
    return order;
  }

  // Pay the specified order by sending a payment source alongside it.
  async payOrder(order, source) {
    try {
      const response = await fetch(`/orders/${order.id}/pay`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({source}),
      });
      const data = await response.json();
      if (data.error) {
        return {error: data.error};
      } else {
        return data;
      }
    } catch (err) {
      return {error: err.message};
    }
  }

  // Fetch an order status from the API.
  async getOrderStatus(orderId) {
    try {
      const response = await fetch(`/orders/${orderId}`);
      return await response.json();
    } catch (err) {
      return {error: err};
    }
  }

  // Format a price (assuming a two-decimal currency like EUR or USD for simplicity).
  formatPrice(amount, currency) {
    let price = (amount / 100).toFixed(2);
    let numberFormat = new Intl.NumberFormat(['en-US'], {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
    });
    return numberFormat.format(price);
  }

  // Set the active order ID in the local storage.
  setActiveOrderId(orderId) {
    localStorage.setItem('orderId', orderId);
  }

  // Get the active order ID from the local storage.
  getActiveOrderId() {
    return localStorage.getItem('orderId');
  }

  // Manipulate the DOM to display the order summary on the right panel.
  // Note: For simplicity, we're just using template strings to inject data in the DOM,
  // but in production you would typically use a library like React to manage this effectively.
  async displayOrderSummary() {
    // Fetch the products from the store to get all the details (name, price, etc.).
    await this.loadProducts();
    const orderItems = document.getElementById('order-items');
    const orderTotal = document.getElementById('order-total');
    let currency;
    // Build and append the line items to the order summary.
    for (let [id, product] of Object.entries(this.products)) {
      const randomQuantity = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };
      const quantity = randomQuantity(1, 3);
      let sku = product.skus.data[0];
      let skuPrice = this.formatPrice(sku.price, sku.currency);
      let lineItemPrice = this.formatPrice(sku.price * quantity, sku.currency);
      let lineItem = document.createElement('div');
      lineItem.classList.add('line-item');
      lineItem.innerHTML = `
        <img class="image" src="/images/products/${product.id}.png">
        <div class="label">
          <p class="product">${product.name}</p>
          <p class="sku">${Object.values(sku.attributes).join(' ')}</p>
        </div>
        <p class="count">${quantity} x ${skuPrice}</p>
        <p class="price">${lineItemPrice}</p>`;
      orderItems.appendChild(lineItem);
      currency = sku.currency;
      this.lineItems.push({
        product: product.id,
        sku: sku.id,
        quantity,
      });
    }
    // Add the subtotal and total to the order summary.
    const total = this.formatPrice(this.getOrderTotal(), currency);
    orderTotal.querySelector('[data-subtotal]').innerText = total;
    orderTotal.querySelector('[data-total]').innerText = total;
    document.getElementById('main').classList.remove('loading');
  }
}

window.store = new Store();
