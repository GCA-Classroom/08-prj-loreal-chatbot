/* DOM references */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const selectedProductsEmpty = document.getElementById("selectedProductsEmpty");
const selectedCount = document.getElementById("selectedCount");
const clearSelectionsBtn = document.getElementById("clearSelections");
const generateRoutineBtn = document.getElementById("generateRoutine");
const latestRoutineStatus = document.getElementById("latestRoutineStatus");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const searchInput = document.getElementById("searchInput");

/* Replace with your Cloudflare Worker URL */
const API_URL = "https://loreal-chatbot-api.lohitthrish.workers.dev/";

/* App state */
let allProducts = [];
let selectedProducts = [];
let isSending = false;
let routineGenerated = false;

/* Chat history */
const chatMessages = [
  {
    role: "system",
    content:
      "You are a L’Oréal beauty assistant. Help users build personalized routines and answer follow-up questions about skincare, haircare, makeup, fragrance, and beauty products. Stay focused on the user's selected products and generated routine. Be concise, helpful, and relevant."
  }
];

/* Initial product area */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Browse all categories or choose one from the dropdown to view products.
  </div>
`;

/* Initial chat message */
addMessage(
  "Hi! Select products to build your routine, then click Generate Routine. After that, you can ask follow-up questions here.",
  "ai"
);

/* Load saved products from localStorage */
function loadSelectedProducts() {
  const saved = localStorage.getItem("selectedProducts");
  selectedProducts = saved ? JSON.parse(saved) : [];
}

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Check if a product is selected */
function isSelected(productId) {
  return selectedProducts.some((product) => product.id === productId);
}

/* Add chat message to UI */
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("msg", sender);
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Update status message above chat */
function setRoutineStatus(text) {
  latestRoutineStatus.textContent = text;
  latestRoutineStatus.classList.remove("hidden");
}

/* Update selected count label */
function updateSelectedCount() {
  const count = selectedProducts.length;
  selectedCount.textContent =
    count === 1 ? "1 product selected" : `${count} products selected`;
}

/* Render selected products section */
function renderSelectedProducts() {
  selectedProductsList.innerHTML = "";
  updateSelectedCount();

  if (selectedProducts.length === 0) {
    selectedProductsEmpty.classList.remove("hidden");
    return;
  }

  selectedProductsEmpty.classList.add("hidden");

  selectedProducts.forEach((product) => {
    const item = document.createElement("li");
    item.className = "selected-product-item";

    item.innerHTML = `
      <div class="selected-product-copy">
        <strong>${product.name}</strong>
        <span>${product.brand} • ${product.category}</span>
      </div>
      <button type="button" class="remove-btn" aria-label="Remove ${product.name}">
        Remove
      </button>
    `;

    item.querySelector(".remove-btn").addEventListener("click", () => {
      selectedProducts = selectedProducts.filter((p) => p.id !== product.id);
      saveSelectedProducts();
      renderSelectedProducts();
      applyCurrentFilter();
    });

    selectedProductsList.appendChild(item);
  });
}

/* Toggle product selection */
function toggleProductSelection(product) {
  if (isSelected(product.id)) {
    selectedProducts = selectedProducts.filter((p) => p.id !== product.id);
  } else {
    selectedProducts.push(product);
  }

  saveSelectedProducts();
  renderSelectedProducts();
  applyCurrentFilter();
}

/* Render product cards */
function displayProducts(products) {
  if (!products.length) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found in this category.
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = `product-card ${isSelected(product.id) ? "selected" : ""}`;
    card.setAttribute("tabindex", "0");

    card.innerHTML = `
      <div class="product-card-inner">
        <img src="${product.image}" alt="${product.name}" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="product-brand">${product.brand}</p>
          <p class="product-category">${product.category}</p>
          <button type="button" class="details-btn">Details</button>
          <div class="product-description hidden">
            ${product.description || "No description available."}
          </div>
        </div>
      </div>
    `;

    const detailsBtn = card.querySelector(".details-btn");
    const description = card.querySelector(".product-description");

    detailsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      description.classList.toggle("hidden");
      detailsBtn.textContent = description.classList.contains("hidden")
        ? "Details"
        : "Hide Details";
    });

    card.addEventListener("click", () => {
      toggleProductSelection(product);
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleProductSelection(product);
      }
    });

    productsContainer.appendChild(card);
  });
}

function applyCurrentFilter() {
  const selectedCategory = categoryFilter.value.toLowerCase();
  const searchTerm = searchInput.value.trim().toLowerCase();

  let filteredProducts = [...allProducts];

  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category.toLowerCase() === selectedCategory
    );
  }

  if (searchTerm) {
    filteredProducts = filteredProducts.filter((product) => {
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    });
  }

  displayProducts(filteredProducts);
}

/* Load products from JSON */
async function loadProducts() {
  try {
    const response = await fetch("products.json");
    const data = await response.json();
    allProducts = data.products || [];
    applyCurrentFilter();
  } catch (error) {
    console.error("Error loading products:", error);
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Sorry, products could not be loaded right now.
      </div>
    `;
  }
}

/* Limit conversation size */
function trimChatMessages() {
  const systemMessage = chatMessages[0];
  const recentMessages = chatMessages.slice(-12);
  chatMessages.length = 0;
  chatMessages.push(systemMessage, ...recentMessages);
}

/* Enable/disable chat UI */
function setChatUIState(disabled) {
  userInput.disabled = disabled;
  sendBtn.disabled = disabled;
  generateRoutineBtn.disabled = disabled;
}

/* Send messages to your Worker */
async function sendToAssistant(userText) {
  if (isSending) return;
  isSending = true;
  setChatUIState(true);

  addMessage(userText, "user");

  chatMessages.push({
    role: "user",
    content: userText
  });

  trimChatMessages();

  addMessage("Typing...", "ai");
  const typingMessage = chatWindow.lastChild;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: chatMessages
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    const aiReply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response right now.";

    if (typingMessage && typingMessage.parentNode) {
      typingMessage.remove();
    }

    addMessage(aiReply, "ai");

    chatMessages.push({
      role: "assistant",
      content: aiReply
    });
  } catch (error) {
    if (typingMessage && typingMessage.parentNode) {
      typingMessage.remove();
    }

    addMessage(
      "Sorry, something went wrong while connecting to the assistant.",
      "ai"
    );
    console.error("Assistant request failed:", error);
  } finally {
    isSending = false;
    setChatUIState(false);
    userInput.focus();
  }
}

/* Generate routine from selected products */
async function generateRoutine() {
  if (selectedProducts.length === 0) {
    addMessage("Please select at least one product before generating a routine.", "ai");
    return;
  }

  const productData = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description
  }));

  const prompt = `
Create a personalized beauty routine using only the selected products below.

Requirements:
- Use only these selected products
- Explain the best order to use them
- Briefly describe what each one does
- Keep the routine clear, personalized, and concise

Selected products:
${JSON.stringify(productData, null, 2)}
  `.trim();

  routineGenerated = true;
  setRoutineStatus("Routine generated from your selected products. You can now ask follow-up questions in the chat.");

  await sendToAssistant(prompt);
}

searchInput.addEventListener("input", () => {
  applyCurrentFilter();
});

/* Event: category filter */
categoryFilter.addEventListener("change", () => {
  applyCurrentFilter();
});

/* Event: clear all selections */
clearSelectionsBtn.addEventListener("click", () => {
  selectedProducts = [];
  saveSelectedProducts();
  renderSelectedProducts();
  applyCurrentFilter();
});

/* Event: generate routine */
generateRoutineBtn.addEventListener("click", () => {
  generateRoutine();
});

/* Event: follow-up chat */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  if (!routineGenerated) {
    addMessage(
      "Generate a routine first, then ask follow-up questions about your products, routine, skincare, haircare, makeup, or fragrance.",
      "ai"
    );
    userInput.value = "";
    return;
  }

  sendToAssistant(text);
  userInput.value = "";
});

/* Initialize app */
function init() {
  loadSelectedProducts();
  renderSelectedProducts();
  loadProducts();
}

init();
