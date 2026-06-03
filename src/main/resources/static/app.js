const menuDiv = document.getElementById("menu");
const cartDiv = document.getElementById("cart");
const totalPriceDiv = document.getElementById("totalPrice");
const tableNumberElement = document.getElementById("tableNumber");
const paymentModal = document.getElementById("paymentModal");
const paymentAmountText = document.getElementById("paymentAmountText");
const paymentQrImage = document.getElementById("paymentQrImage");
const paymentLinkText = document.getElementById("paymentLinkText");

let foods = [];
let cart = [];
let currentOrderId = null;
let currentPaymentOrderId = null;

/*
    Lấy tableId từ URL

    Ví dụ:
    index.html?table=1
*/

const params = new URLSearchParams(window.location.search);

const tableId = params.get("table") || 1;

tableNumberElement.innerText = "Bàn " + tableId;

loadPendingOrderForTable();

/*
    Load menu từ database
*/

fetch("/api/foods")
  .then((response) => response.json())
  .then((data) => {
    foods = data;
    renderMenu();
  })
  .catch((error) => {
    console.error("Lỗi load menu:", error);
    menuDiv.innerHTML = `<h2>Không thể tải menu</h2>`;
  });

/*
    Hiển thị menu
*/

function renderMenu() {
  menuDiv.innerHTML = "";

  foods.forEach((food) => {
    const card = document.createElement("div");

    card.className = "food-card";
    card.innerHTML = `
            <img src="${food.image}" alt="${food.name}">
            <div class="food-card-content">
              <h3>${food.name}</h3>
              <p class="price-tag">${food.price.toLocaleString()} đ</p>
              <button onclick="addToCart(${food.id})">Thêm vào giỏ</button>
            </div>
        `;

    menuDiv.appendChild(card);
  });
}

/*
    Thêm món vào giỏ hàng
*/

function addToCart(foodId) {
  const food = foods.find((item) => item.id === foodId);
  if (!food) {
    alert("Không tìm thấy món ăn");
    return;
  }

  const existing = cart.find((item) => item.id === food.id && !item.ordered);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      ...food,
      quantity: 1,
    });
  }

  renderCart();
}

/*
    Render giỏ hàng
*/

function renderCart() {
  cartDiv.innerHTML = "";

  let total = 0;
  let orderedTotal = 0;
  let pendingTotal = 0;

  if (cart.length === 0) {
    cartDiv.innerHTML = "<p>Giỏ hàng trống</p>";
    totalPriceDiv.innerText = "Tổng: 0 đ";
    return;
  }

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    if (item.ordered) {
      orderedTotal += itemTotal;
    } else {
      pendingTotal += itemTotal;
    }

    const div = document.createElement("div");
    div.className = "cart-item" + (item.ordered ? " ordered" : "");
    const statusIcon = item.ordered ? "✅" : "⏳";

    div.innerHTML = `
            <p><strong>${statusIcon} ${item.name}</strong></p>
            <p>Số lượng: <strong>${item.quantity}</strong></p>
            <p><strong>${itemTotal.toLocaleString()} đ</strong></p>
            <div class="cart-controls">
              <button onclick="increaseQuantity(${item.id})" ${item.ordered ? "disabled" : ""}>+</button>
              <button onclick="decreaseQuantity(${item.id})" ${item.ordered ? "disabled" : ""}>-</button>
              <button onclick="removeItem(${item.id})" ${item.ordered ? "disabled" : ""}>Xóa</button>
            </div>
        `;

    cartDiv.appendChild(div);
  });

  let totalText = "Tổng: " + total.toLocaleString() + " đ";
  if (pendingTotal > 0) {
    totalText += ` (Chờ: ${pendingTotal.toLocaleString()} đ, Đã đặt: ${orderedTotal.toLocaleString()} đ)`;
  }
  totalPriceDiv.innerText = totalText;
}

function increaseQuantity(foodId) {
  const item = cart.find((item) => item.id === foodId);
  if (item && !item.ordered) {
    item.quantity++;
    renderCart();
  }
}

function decreaseQuantity(foodId) {
  const item = cart.find((item) => item.id === foodId);
  if (!item || item.ordered) return;

  item.quantity--;
  if (item.quantity <= 0) {
    cart = cart.filter((item) => item.id !== foodId);
  }
  renderCart();
}

function removeItem(foodId) {
  const item = cart.find((i) => i.id === foodId);
  if (item && !item.ordered) {
    cart = cart.filter((item) => item.id !== foodId);
    renderCart();
  }
}

function submitOrder() {
  if (cart.length === 0) {
    alert("Giỏ hàng đang trống");
    return;
  }

  const notOrderedItems = cart.filter((item) => !item.ordered);
  if (notOrderedItems.length === 0) {
    alert("Tất cả món đã được đặt rồi!");
    return;
  }

  const orderData = {
    tableId: tableId,
    items: notOrderedItems.map((item) => ({
      foodId: item.id,
      quantity: item.quantity,
    })),
  };

  fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(text || "Lỗi đặt món");
        });
      }
      return response.json();
    })
    .then((data) => {
      currentOrderId = data.orderId;
      alert(data.message || "Đặt món thành công");

      notOrderedItems.forEach((item) => {
        item.ordered = true;
      });
      renderCart();
      notifyOrderUpdate();
    })
    .catch((error) => {
      console.error("Lỗi đặt món:", error);
      alert("Đặt món thất bại: " + error.message);
    });
}

function payment() {
  const orderedItems = cart.filter((item) => item.ordered);
  if (orderedItems.length === 0) {
    alert("Không có món để thanh toán. Hãy đặt hàng trước!");
    return;
  }

  getPendingOrderForTable()
    .then((orderId) => {
      if (!orderId) {
        alert("Không tìm thấy đơn hàng đang chờ. Vui lòng đặt món trước.");
        return;
      }

      return fetch(`/api/orders/${orderId}/payment`);
    })
    .then((response) => {
      if (!response) return;
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(text || "Lỗi tạo yêu cầu thanh toán");
        });
      }
      return response.json();
    })
    .then((data) => {
      if (!data) return;
      currentPaymentOrderId = currentOrderId;
      showPaymentModal(data);
    })
    .catch((error) => {
      console.error("Lỗi thanh toán:", error);
      alert("Thanh toán thất bại: " + error.message);
    });
}

function getPendingOrderForTable() {
  if (currentOrderId) {
    return Promise.resolve(currentOrderId);
  }

  return fetch(`/api/orders/tables/${tableId}/pending`)
    .then((response) => {
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .then((order) => {
      if (order && order.id) {
        currentOrderId = order.id;
        return currentOrderId;
      }
      return null;
    })
    .catch(() => null);
}

function showPaymentModal(payment) {
  paymentAmountText.innerText = `Số tiền cần thanh toán: ${payment.amount.toLocaleString()} đ`;
  paymentQrImage.src = payment.qrCodeDataUrl;
  paymentLinkText.innerHTML = `Nếu mã QR không quét được, mở liên kết MoMo: <a href="${payment.payUrl}" target="_blank" rel="noreferrer">Mở MoMo</a>`;
  paymentModal.classList.add("open");
}

function closePaymentModal() {
  paymentModal.classList.remove("open");
}

function confirmMomoPayment() {
  if (!currentPaymentOrderId) {
    alert("Không tìm thấy đơn thanh toán để xác nhận.");
    return;
  }

  fetch(`/api/orders/${currentPaymentOrderId}/payment/notify`, {
    method: "POST",
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(text || "Xác nhận thanh toán thất bại");
        });
      }
      return response.text();
    })
    .then((message) => {
      alert(message || "Thanh toán đã được xác nhận");
      cart = cart.filter((item) => !item.ordered);
      currentOrderId = null;
      currentPaymentOrderId = null;
      renderCart();
      closePaymentModal();
      notifyPaymentUpdate();
    })
    .catch((error) => {
      console.error("Lỗi xác nhận thanh toán:", error);
      alert("Xác nhận thanh toán thất bại: " + error.message);
    });
}

function loadPendingOrderForTable() {
  fetch(`/api/orders/tables/${tableId}/pending`)
    .then((response) => {
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .then((order) => {
      if (order && order.id) {
        currentOrderId = order.id;
      }
    })
    .catch(() => {
      // Không cần xử lý nếu không có order đang chờ
    });
}

function notifyOrderUpdate() {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("restaurant-order");
    channel.postMessage({ type: "NEW_ORDER", tableId });
    channel.close();
  } else {
    localStorage.setItem(
      "newOrder",
      JSON.stringify({ tableId, timestamp: Date.now() }),
    );
  }
}

function notifyPaymentUpdate() {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("restaurant-payment");
    channel.postMessage({ type: "PAYMENT_SUCCESS", tableId });
    channel.close();
  } else {
    localStorage.setItem(
      "restaurant-payment",
      JSON.stringify({ tableId, timestamp: Date.now() }),
    );
  }
}
