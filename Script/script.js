
let cart = JSON.parse(localStorage.getItem("cart")) || [];

cart = cart.map((item) => {
  return { ...item, quantity: item.quantity || 1 };
});
// Define discount and tax rates for all calculations. These values can be
// adjusted if the business decides to change promotional discounts or tax rates.
const DISCOUNT_RATE = 0.1; // 10% discount applied on subtotal
const TAX_RATE = 0.15; // 15% tax applied after discount

//--------------------------------------------------
// Helpers: save + cart count
//--------------------------------------------------
function saveCart() {
  // Persist the cart and keep the cart counter in sync
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  // Show total quantity of items, not just number of unique products
  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const counters = document.querySelectorAll("#cart-count");
  counters.forEach((c) => {
    c.textContent = totalItems;
  });
}

/**
 * Calculate subtotal, discount, tax and final total for the current cart.
 * Returns an object with subtotal, discount, tax and total values.
 */
function computeTotals(items = cart) {
  let subtotal = 0;
  items.forEach((item) => {
    subtotal += (Number(item.price) || 0) * (item.quantity || 1);
  });
  const discount = subtotal * DISCOUNT_RATE;
  const taxable = subtotal - discount;
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;
  return {
    subtotal,
    discount,
    tax,
    total,
  };
}

//--------------------------------------------------
// Add / Remove / Clear Cart
//--------------------------------------------------
function addToCart(name, price) {
  // When adding a product, check if it already exists in the cart.
  // If so, increment its quantity, otherwise add as a new item with quantity 1.
  const numericPrice = Number(price) || 0;
  const existing = cart.find((item) => item.name === name && item.price === numericPrice);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      name: name,
      price: numericPrice,
      quantity: 1,
    });
  }
  saveCart();
  alert(`${name} added to cart!`);
}

function removeFromCart(index) {
  // Remove the selected item by index
  cart.splice(index, 1);
  saveCart();
  renderCart();
  renderCheckoutSummary();
}

function clearCart() {
  // Empty the entire cart and refresh displays
  cart = [];
  saveCart();
  renderCart();
  renderCheckoutSummary();
}

//--------------------------------------------------
// Render Cart (cart.html)
// Uses: #cart-items, #cart-total, #cart-summary
//--------------------------------------------------
function renderCart() {
  const itemsContainer = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  const summaryContainer = document.getElementById("cart-summary");

  if (!itemsContainer) return; // not on cart page

  itemsContainer.innerHTML = "";

  if (!cart.length) {
    // Empty cart message
    itemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    if (totalElement) totalElement.textContent = "$0";
    if (summaryContainer) summaryContainer.innerHTML = "";
    return;
  }

  // Build a table structure for cart items with quantity and subtotal columns
  const table = document.createElement("table");
  table.className = "cart-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Item</th>
        <th>Price</th>
        <th>Quantity</th>
        <th>Sub‑total</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  cart.forEach((item, index) => {
    const price = Number(item.price) || 0;
    const qty = item.quantity || 1;
    const sub = price * qty;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>$${price.toLocaleString()}</td>
      <td>
        <input type="number" min="1" value="${qty}" data-index="${index}" class="qty-input">
      </td>
      <td>$${sub.toLocaleString()}</td>
      <td><button type="button" class="btn-remove" data-index="${index}">Remove</button></td>
    `;
    tbody.appendChild(row);
  });

  itemsContainer.appendChild(table);

  // Attach change listeners for quantity inputs
  itemsContainer.querySelectorAll(".qty-input").forEach((input) => {
    input.addEventListener("change", () => {
      const idx = Number(input.dataset.index);
      const value = Number(input.value) || 1;
      updateQuantity(idx, value);
    });
  });

  // Hook up remove buttons
  itemsContainer.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      removeFromCart(idx);
    });
  });

  // Compute totals and display summary
  const totals = computeTotals();
  const { subtotal, discount, tax, total } = totals;
  if (totalElement) {
    // Only update total if an element exists (legacy support)
    totalElement.textContent = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="summary-row"><span>Subtotal:</span> <strong>$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
      <div class="summary-row"><span>Discount (10%):</span> <strong>-$${discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
      <div class="summary-row"><span>Tax (15%):</span> <strong>$${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
      <div class="summary-row total"><span>Total:</span> <strong>$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    `;
  }
}

//--------------------------------------------------
// Checkout (checkout.html)
// Stores invoiceData then redirects
//--------------------------------------------------
function setupCheckoutForm() {
  const checkoutForm = document.getElementById("checkout-form");
  if (!checkoutForm) return;

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const address = document.getElementById("address").value.trim();
    const email = document.getElementById("email").value.trim();
    const notes = document.getElementById("notes").value.trim();

    // Capture a snapshot of the cart and computed totals for the invoice
    const totals = computeTotals();
    const invoiceData = {
      name,
      address,
      email,
      notes,
      cart: [...cart],
      totals,
    };

    localStorage.setItem("invoiceData", JSON.stringify(invoiceData));
    // After checkout, you may choose to clear the cart
    // but for this assignment we'll keep the cart so the invoice renders correctly.
    window.location = "invoice.html";
  });
}

//--------------------------------------------------
// Invoice (invoice.html)
// Uses #invoice-content, reads invoiceData
//--------------------------------------------------
function renderInvoice() {
  const invoiceBox = document.getElementById("invoice-content");
  if (!invoiceBox) return; // not on invoice page

  const data = JSON.parse(localStorage.getItem("invoiceData") || "null");
  const items = data?.cart || cart;

  invoiceBox.innerHTML = "";

  if (!items || !items.length) {
    invoiceBox.innerHTML = "<p>No items found for this invoice.</p>";
    return;
  }

  // Compute totals using either stored totals or recomputing from items
  const totals = data?.totals || computeTotals(items);
  const { subtotal, discount, tax, total } = totals;

  // Header block with customer info and date
  const header = document.createElement("div");
  header.className = "invoice-header";
  header.innerHTML = `
    <div>
      <strong>${data?.name || "Customer"}</strong><br>
      ${data?.address || ""}<br>
      ${data?.email || ""}
    </div>
    <div>
      <strong>Date:</strong> ${new Date().toLocaleDateString()}
    </div>
  `;
  invoiceBox.appendChild(header);

  // Table with quantity and subtotal columns
  const table = document.createElement("table");
  table.className = "invoice-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Item</th>
        <th>Price</th>
        <th>Qty</th>
        <th>Sub‑total</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  items.forEach((item) => {
    const price = Number(item.price) || 0;
    const qty = item.quantity || 1;
    const sub = price * qty;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>$${price.toLocaleString()}</td>
      <td>${qty}</td>
      <td>$${sub.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    `;
    tbody.appendChild(row);
  });

  invoiceBox.appendChild(table);

  // Summary section for subtotal, discount, tax and total
  const summary = document.createElement("div");
  summary.className = "invoice-summary";
  summary.innerHTML = `
    <div class="summary-row"><span>Subtotal:</span> <strong>$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    <div class="summary-row"><span>Discount (10%):</span> <strong>-$${discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    <div class="summary-row"><span>Tax (15%):</span> <strong>$${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    <div class="summary-row total"><span>Total:</span> <strong>$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
  `;
  invoiceBox.appendChild(summary);
}

//--------------------------------------------------
// Hook up Add-to-Cart buttons + init
//--------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Attach add-to-cart listeners
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const price = btn.dataset.price;
      addToCart(name, price);
    });
  });

  updateCartCount();
  renderCart();
  setupCheckoutForm();
  renderInvoice();
  renderCheckoutSummary();
  
  const cards = document.querySelectorAll('.product-card');
  if (cards.length) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach((card) => observer.observe(card));
  }
});

/**
 * Update the cart summary section on the checkout page.
 * This function mirrors the summary shown on the cart page so customers
 * can verify their order before submitting.
 */
function renderCheckoutSummary() {
  const summaryContainer = document.getElementById("checkout-summary");
  if (!summaryContainer) return; // not on checkout page

  if (!cart.length) {
    summaryContainer.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  const totals = computeTotals();
  const { subtotal, discount, tax, total } = totals;

  // Build a miniature summary similar to cart page
  let html = "<h3>Order Summary</h3>";
  html += '<ul class="summary-list">';
  cart.forEach((item) => {
    const price = Number(item.price) || 0;
    const qty = item.quantity || 1;
    const sub = price * qty;
    html += `<li>${item.name} (x${qty}) - $${sub.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>`;
  });
  html += "</ul>";
  html += `
    <div class="summary-row"><span>Subtotal:</span> <strong>$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    <div class="summary-row"><span>Discount (10%):</span> <strong>-$${discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    <div class="summary-row"><span>Tax (15%):</span> <strong>$${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    <div class="summary-row total"><span>Total:</span> <strong>$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
  `;

  summaryContainer.innerHTML = html;
}

/**
 * Update the quantity of an item in the cart by index.
 * Enforces a minimum quantity of 1.
 */
function updateQuantity(index, quantity) {
  const qty = Math.max(1, Number(quantity) || 1);
  if (cart[index]) {
    cart[index].quantity = qty;
    saveCart();
    renderCart();
    renderCheckoutSummary();
  }
}
