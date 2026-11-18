/* ---------- DOM elements ---------- */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateRoutine");
const clearBtn = document.getElementById("clearBtn");
const dirToggle = document.getElementById("dirToggle");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");

/* ---------- Settings ---------- */
// Your Cloudflare Worker URL. No API key here: the Worker keeps it secret.
const WORKER_URL = "https://lorial-worker.mamadoucth.workers.dev/";

// The key we use to save selected product ids in localStorage
const STORAGE_KEY = "selectedProductIds";

/* ---------- App state ---------- */
let allProducts = []; // every product from products.json
let selectedIds = []; // ids of the products the user picked

// The whole conversation lives here (this gives the chatbot memory).
// The first message is the system prompt that sets the rules.
const messages = [
  {
    role: "system",
    content: `You are the L'Oréal Routine Builder, a friendly beauty advisor.
Only answer questions about the user's generated routine or about skincare,
haircare, makeup, fragrance, suncare, men's grooming and related beauty topics.
If asked about anything else, politely say you can only help with beauty topics.
When given a list of products, build a clear step-by-step routine (morning and
evening if it makes sense) using ONLY those products, in a sensible order, and
briefly say why each step matters. Write in plain text with no markdown symbols
like ** or #. Use numbered steps. Remember details the user shares.`,
  },
];

/* ---------- Load products ---------- */
async function loadProducts() {
  // Fetch the JSON file and return the list of products
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* ---------- localStorage helpers ---------- */
function saveSelection() {
  // Save the selected ids as text
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
}

function loadSelection() {
  // Read the saved ids back (or start empty if nothing is saved)
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

/* ---------- Fill the category dropdown ---------- */
function fillCategories() {
  // Get each category once, then add an <option> for it
  const categories = [...new Set(allProducts.map((p) => p.category))].sort();
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

/* ---------- Show products (filtered by category AND search) ---------- */
function displayProducts() {
  const category = categoryFilter.value;
  const searchText = productSearch.value.trim().toLowerCase();

  const matches = allProducts.filter((p) => {
    const categoryOk = category === "all" || p.category === category;
    // Search the name, brand, category and description
    const haystack =
      `${p.name} ${p.brand} ${p.category} ${p.description}`.toLowerCase();
    return categoryOk && haystack.includes(searchText);
  });

  if (matches.length === 0) {
    productsContainer.innerHTML = `<p class="no-results">No products found.</p>`;
    return;
  }

  // Build one card per product (the data comes from our own JSON file)
  productsContainer.innerHTML = matches
    .map((p) => {
      const isSelected = selectedIds.includes(p.id);
      return `
      <article class="product-card ${isSelected ? "selected" : ""}">
        <button type="button" class="card-main" data-id="${p.id}"
                aria-pressed="${isSelected}">
          <img src="${p.image}" alt="${p.name}" />
          <span class="card-brand">${p.brand}</span>
          <span class="card-name">${p.name}</span>
          <span class="card-check">${isSelected ? "✓ Selected" : ""}</span>
        </button>
        <button type="button" class="details-toggle" data-details="${p.id}"
                aria-expanded="false" aria-controls="desc-${p.id}">
          Show details
        </button>
        <div class="card-description" id="desc-${p.id}" hidden>
          ${p.description}
        </div>
      </article>`;
    })
    .join("");
}

/* ---------- Show the "Selected Products" section ---------- */
function displaySelected() {
  const selected = allProducts.filter((p) => selectedIds.includes(p.id));

  if (selected.length === 0) {
    selectedProductsList.innerHTML = `<p class="empty-note">No products selected yet. Click a product card to add it.</p>`;
  } else {
    selectedProductsList.innerHTML = selected
      .map(
        (p) => `
        <div class="selected-chip">
          <span>${p.brand} – ${p.name}</span>
          <button type="button" data-remove="${p.id}"
                  aria-label="Remove ${p.name}">
            <span class="material-icons">close</span>
          </button>
        </div>`,
      )
      .join("");
  }

  clearBtn.hidden = selected.length === 0;
}

/* ---------- Select / unselect a product ---------- */
function toggleProduct(id) {
  if (selectedIds.includes(id)) {
    selectedIds = selectedIds.filter((savedId) => savedId !== id); // remove
  } else {
    selectedIds.push(id); // add
  }
  saveSelection();
  displayProducts();
  displaySelected();
}

/* ---------- Click handling (one listener for the whole grid) ---------- */
productsContainer.addEventListener("click", (e) => {
  // Clicked the "Show details" button?
  const detailsBtn = e.target.closest("[data-details]");
  if (detailsBtn) {
    const description = document.getElementById(
      `desc-${detailsBtn.dataset.details}`,
    );
    const isHidden = description.hidden;
    description.hidden = !isHidden; // flip it
    detailsBtn.setAttribute("aria-expanded", String(isHidden));
    detailsBtn.textContent = isHidden ? "Hide details" : "Show details";
    return;
  }

  // Clicked the card itself?
  const cardBtn = e.target.closest("[data-id]");
  if (cardBtn) {
    toggleProduct(Number(cardBtn.dataset.id));
  }
});

// Remove one item from the Selected Products list
selectedProductsList.addEventListener("click", (e) => {
  const removeBtn = e.target.closest("[data-remove]");
  if (removeBtn) {
    toggleProduct(Number(removeBtn.dataset.remove));
  }
});

// Clear all selections at once
clearBtn.addEventListener("click", () => {
  selectedIds = [];
  saveSelection();
  displayProducts();
  displaySelected();
});

// Re-filter when the category changes or the user types in the search box
categoryFilter.addEventListener("change", displayProducts);
productSearch.addEventListener("input", displayProducts);

/* ---------- RTL support: flip page direction ---------- */
dirToggle.addEventListener("click", () => {
  const html = document.documentElement;
  html.dir = html.dir === "rtl" ? "ltr" : "rtl";
  localStorage.setItem("pageDir", html.dir);
});

/* ---------- Chat helpers ---------- */
function addMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `msg ${role}`;
  bubble.textContent = text; // textContent is safe
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

// Sends the whole conversation to the Worker and returns the reply text
async function getAIReply() {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages }),
  });
  const data = await response.json();

  // If OpenAI (or the Worker) sent back an error, show its message
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.choices[0].message.content;
}

/* ---------- Generate Routine button ---------- */
generateBtn.addEventListener("click", async () => {
  // Collect ONLY the selected products and keep just the useful fields
  const selected = allProducts
    .filter((p) => selectedIds.includes(p.id))
    .map((p) => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      description: p.description,
    }));

  if (selected.length === 0) {
    addMessage("ai", "Please select at least one product first.");
    return;
  }

  // Add the products (as JSON) to the conversation
  messages.push({
    role: "user",
    content: `Create a personalized routine using these products:\n${JSON.stringify(selected, null, 2)}`,
  });

  latestQuestion.textContent = "You asked: Generate a routine for my selected products";
  generateBtn.disabled = true;
  const thinking = addMessage("ai", "Building your routine…");

  try {
    const reply = await getAIReply();
    thinking.textContent = reply;
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error("Error:", error);
    thinking.textContent = `Sorry, something went wrong: ${error.message}`;
    messages.pop(); // remove the failed request so history stays clean
  }

  generateBtn.disabled = false;
});

/* ---------- Follow-up questions ---------- */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (text === "") return;

  addMessage("user", text);
  latestQuestion.textContent = `You asked: ${text}`;
  messages.push({ role: "user", content: text });
  userInput.value = "";

  const thinking = addMessage("ai", "Thinking…");

  try {
    const reply = await getAIReply();
    thinking.textContent = reply;
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error("Error:", error);
    thinking.textContent = `Sorry, something went wrong: ${error.message}`;
    messages.pop();
  }
});

/* ---------- Start the app ---------- */
async function init() {
  // Restore the saved page direction
  document.documentElement.dir = localStorage.getItem("pageDir") || "ltr";

  addMessage(
    "ai",
    "👋 Pick some products, then press Generate Routine. You can ask follow-up questions here too.",
  );

  allProducts = await loadProducts();
  selectedIds = loadSelection(); // restore saved selection
  fillCategories();
  displayProducts();
  displaySelected();
}

init();