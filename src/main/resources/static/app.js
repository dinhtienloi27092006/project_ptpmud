const menuDiv = document.getElementById("menu");
const cartDiv = document.getElementById("cart");
const totalPriceDiv = document.getElementById("totalPrice");
const tableNumberElement = document.getElementById("tableNumber");

console.log("app.js loaded");

let foods = [];
let cart = [];
let activeCategory = "";
let sortOrder = "";
const DEFAULT_CATEGORIES = [
  "",
  "Món chính",
  "Hải sản",
  "Lẩu",
  "Nướng",
  "Món thêm",
  "Tráng miệng",
  "Nước uống",
  "Combo",
];
let currentOrderId = null;

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
    populateCategoryButtons();
    setupFilters();
  })
  .catch((error) => {
    console.error("Lỗi load menu:", error);
    menuDiv.innerHTML = `<h2>Không thể tải menu</h2>`;
    // Initialize the static category buttons and filters so UI remains usable when API is down
    try {
      populateCategoryButtons();
      setupFilters();
    } catch (e) {
      console.warn("Không thể khởi tạo bộ lọc tĩnh:", e);
    }
  });

/*
    Hiển thị menu
*/

function renderMenu() {
  menuDiv.innerHTML = "";

  const orderedFoods = [...foods];
  if (sortOrder === "asc") {
    orderedFoods.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortOrder === "desc") {
    orderedFoods.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  orderedFoods.forEach((food) => {
    const card = document.createElement("div");
    card.className = "food-card";
    card.id = "food-" + food.id;
    card.dataset.category = (food.category || "").toLowerCase();

    const img = document.createElement("img");
    img.src = food.image || "";
    img.alt = food.name || "";

    const content = document.createElement("div");
    content.className = "food-card-content";

    const h3 = document.createElement("h3");
    h3.textContent = food.name || "";

    const catLabel = document.createElement("div");
    catLabel.className = "food-category";
    catLabel.textContent = food.category || "";

    const p = document.createElement("p");
    p.className = "price-tag";
    p.textContent = (food.price || 0).toLocaleString() + " đ";

    const btn = document.createElement("button");
    btn.textContent = "Thêm vào giỏ";
    btn.onclick = () => addToCart(food.id);

    content.appendChild(h3);
    content.appendChild(catLabel);
    content.appendChild(p);
    content.appendChild(btn);

    card.appendChild(img);
    card.appendChild(content);

    menuDiv.appendChild(card);
  });
}

function populateCategoryButtons() {
  const container = document.getElementById("categoryFilters");
  const sortContainer = document.getElementById("sortButtons");
  if (!container) return;

  const existingButtons = Array.from(container.querySelectorAll(".filter-btn"));

  if (existingButtons.length === 0) {
    DEFAULT_CATEGORIES.forEach((c, idx) => {
      const b = document.createElement("button");
      b.className = "filter-btn";
      b.setAttribute("data-category", c);
      b.textContent = c === "" ? "Tất cả" : c;
      if (idx === 0) b.classList.add("active");
      b.addEventListener("click", () => setActiveCategory(c));
      container.appendChild(b);
    });
  } else {
    existingButtons.forEach((btn) => {
      const category = btn.getAttribute("data-category") || "";
      btn.addEventListener("click", () => setActiveCategory(category));
    });
  }

  container.style.zIndex = 20;
  attachFilterDebugVisuals(container);

  if (sortContainer) {
    const sortButtons = Array.from(sortContainer.querySelectorAll(".sort-btn"));
    sortButtons.forEach((btn) => {
      btn.addEventListener("click", () =>
        setSortOrder(btn.getAttribute("data-sort") || ""),
      );
    });
  }
}

function setupFilters() {
  const search = document.getElementById("foodSearch");

  if (search) {
    search.addEventListener("input", () => filterFoods());
  }
}

function setActiveCategory(category) {
  activeCategory = category || "";
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      (btn.getAttribute("data-category") || "") === activeCategory,
    );
  });

  filterFoods();
  if (activeCategory) {
    scrollToCategory(activeCategory);
  }
}

function setSortOrder(order) {
  sortOrder = order === sortOrder ? "" : order;
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-sort") === sortOrder);
  });
  renderMenu();
  filterFoods();
}

function attachFilterDebugVisuals(container) {
  if (!container) return;
  const btns = container.querySelectorAll(".filter-btn");
  btns.forEach((b) => {
    // avoid attaching multiple times
    if (b.dataset.debugAttached) return;
    b.dataset.debugAttached = "1";

    b.addEventListener("mousedown", () => {
      b.style.transform = "scale(0.98)";
      b.style.filter = "brightness(0.98)";
    });
    b.addEventListener("mouseup", () => {
      setTimeout(() => {
        b.style.transform = "";
        b.style.filter = "";
      }, 180);
    });

    b.addEventListener("click", (e) => {
      console.debug(
        "Debug: button click registered on",
        b.getAttribute("data-category"),
      );
      // flash background to make it obvious
      const prev = b.style.boxShadow;
      b.style.boxShadow = "0 0 0 3px rgba(255, 122, 24, 0.18)";
      setTimeout(() => (b.style.boxShadow = prev), 300);
    });
  });
}

function filterFoods(category = null) {
  const q = (document.getElementById("foodSearch")?.value || "").toLowerCase();
  const effectiveCategory = category === null ? activeCategory : category;
  console.debug("filterFoods", { effectiveCategory, query: q });
  const cards = Array.from(menuDiv.children);

  cards.forEach((card) => {
    const name = (card.querySelector("h3")?.textContent || "").toLowerCase();
    const cat = (card.dataset.category || "").toLowerCase();

    const matchesQuery = q === "" || name.includes(q);
    let matchesCategory = true;
    if (effectiveCategory && effectiveCategory !== "") {
      matchesCategory = cat === effectiveCategory.toLowerCase();
    }

    card.style.display = matchesQuery && matchesCategory ? "block" : "none";
  });
}

function scrollToCategory(category) {
  const cat = (category || "").toLowerCase();
  const cards = Array.from(menuDiv.children);
  const first = cards.find(
    (c) => (c.dataset.category || "") === cat && c.style.display !== "none",
  );
  if (first) {
    first.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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

function clearPaidItems() {
  const hadPaidItems = cart.some((item) => item.ordered);
  if (!hadPaidItems) {
    return;
  }

  cart = cart.filter((item) => !item.ordered);
  currentOrderId = null;
  renderCart();
  alert("Đơn hàng đã được thanh toán. Giỏ hàng đã được cập nhật.");
}

if (typeof BroadcastChannel !== "undefined") {
  const paymentChannel = new BroadcastChannel("restaurant-payment");
  paymentChannel.onmessage = (event) => {
    if (
      event.data?.type === "PAYMENT_SUCCESS" &&
      event.data.tableNumber == tableId
    ) {
      clearPaidItems();
    }
  };
} else {
  window.addEventListener("storage", (event) => {
    if (event.key === "restaurant-payment") {
      try {
        const data = JSON.parse(event.newValue || event.oldValue || "{}");
        if (data.tableNumber == tableId) {
          clearPaidItems();
        }
      } catch (error) {
        console.warn("Không parse được dữ liệu thanh toán:", error);
      }
    }
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

if (typeof window !== "undefined") {
  window.handleCategoryButtonClick = handleCategoryButtonClick;
  window.filterFoods = filterFoods;
  window.submitOrder = submitOrder;
  window.addToCart = addToCart;
  window.increaseQuantity = increaseQuantity;
  window.decreaseQuantity = decreaseQuantity;
  window.removeItem = removeItem;
}
