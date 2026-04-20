/* ============================================================
   L'Oréal Routine Builder & Beauty Advisor — script.js
   ============================================================ */

const WORKER_URL = 'https://lorealworker.mnngo.workers.dev/';
const LS_KEY = 'loreal_selected_products';

const SYSTEM_PROMPT = `You are an expert L'Oréal Smart Routine & Product Advisor — \
a knowledgeable, warm, and enthusiastic beauty consultant representing the L'Oréal Group.

Your role is to help customers:
• Discover the right L'Oréal products for their skin type, tone, hair type, and beauty goals
• Build personalised morning and evening skincare routines
• Learn how to correctly layer skincare products (order of application, waiting times)
• Get makeup tips, colour-matching advice, and application techniques
• Understand haircare regimens — from scalp health to colour protection and heat styling
• Learn about key active ingredients: retinol, hyaluronic acid, niacinamide, vitamin C,
  ceramides, glycolic acid, SPF, and how they benefit different skin concerns

When you receive a list of selected products to create a routine:
• Analyse the products and build a clear, step-by-step personalised routine
• Organise by Morning Routine / Evening Routine / Weekly Treatments as appropriate
• Include application order, amounts, and tips for each product
• Note any ingredient synergies or important layering advice
• Use numbered steps and clear headings for readability

L'Oréal brands and product lines you should reference (not exhaustive):
Skincare — Revitalift (anti-ageing), Age Perfect (mature skin), Pure Clay (deep clean),
  Bright Reveal (vitamin C), Hydra Genius (hydration), Bright Skin (dark spots)
Foundation & Complexion — True Match, Infallible Fresh Wear, Accord Parfait
Eyes & Lips — Voluminous, Telescopic, Colour Riche, Infallible Lip, Paradise Mascara
Haircare — Elvive (EverPure, Total Repair, Dream Lengths, Colour Protect, Extraordinary Oil),
  Casting Crème Gloss, Excellence Crème, Botanicals Fresh Care
Men — Men Expert Hydra Energetic, Barber Club, Vita Lift

When a customer's skin or hair type is unclear, ask one short clarifying question before recommending.
Keep responses friendly, professional, and concise. Use bullet points or numbered steps for routines.

IMPORTANT — Topic scope:
You ONLY answer questions related to L'Oréal products, beauty routines, skincare, haircare,
makeup, fragrance, personal care, and beauty ingredient science. If a user asks about anything
outside this scope — cooking, sports, politics, finance, coding, etc. — respond with exactly:
"I'm here exclusively for all things L'Oréal beauty! I'm not able to help with that topic, \
but I'd love to assist you with skincare routines, product recommendations, or beauty tips. \
What beauty question can I answer for you today?"`;

// ── State ─────────────────────────────────────────────────────
const selectedProducts = new Set();
let currentCategory = 'All';
let currentSearch = '';
let webSearchEnabled = false;
let currentModalProductId = null;

const conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];

// ── DOM refs ──────────────────────────────────────────────────
const productGrid       = document.getElementById('product-grid');
const noResults         = document.getElementById('no-results');
const productSearch     = document.getElementById('product-search');
const selectedList      = document.getElementById('selected-list');
const selectedCount     = document.getElementById('selected-count');
const emptyHint         = document.getElementById('empty-hint');
const clearAllBtn       = document.getElementById('clear-all-btn');
const generateBtn       = document.getElementById('generate-routine-btn');
const chatWindow        = document.getElementById('chat-window');
const typingIndicator   = document.getElementById('typing-indicator');
const userInput         = document.getElementById('user-input');
const sendBtn           = document.getElementById('send-btn');
const productModal      = document.getElementById('product-modal');
const modalContent      = document.getElementById('modal-content');
const modalClose        = document.getElementById('modal-close');
const webSearchToggle   = document.getElementById('web-search-toggle');
const rtlToggle         = document.getElementById('rtl-toggle');
const mainScroll        = document.getElementById('main-scroll');

// ── Text formatter ────────────────────────────────────────────
function formatText(raw) {
  let t = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');

  // Clickable URLs
  t = t.replace(/(https?:\/\/[^\s<"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>');

  // Process blocks separated by double newlines
  const blocks = t.split(/\n\n+/);
  return blocks.map(block => {
    const lines = block.split('\n');
    const hasBullet   = lines.some(l => /^[\s]*[-•*]\s/.test(l));
    const hasNumbered = lines.some(l => /^[\s]*\d+[.)]\s/.test(l));

    if (hasBullet) {
      const items = lines
        .filter(l => l.trim())
        .map(l => `<li>${l.replace(/^[\s]*[-•*]\s+/, '')}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    }
    if (hasNumbered) {
      const items = lines
        .filter(l => l.trim())
        .map(l => `<li>${l.replace(/^[\s]*\d+[.)]\s+/, '')}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    }
    return `<p>${lines.join('<br>')}</p>`;
  }).join('');
}

// ── Product grid ──────────────────────────────────────────────
function renderProducts() {
  const search = currentSearch.toLowerCase().trim();
  const filtered = PRODUCTS.filter(p => {
    const matchCat = currentCategory === 'All' || p.category === currentCategory;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search) ||
      p.tagline.toLowerCase().includes(search) ||
      p.brand.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search) ||
      p.keyIngredients.some(i => i.toLowerCase().includes(search));
    return matchCat && matchSearch;
  });

  productGrid.innerHTML = '';
  noResults.classList.toggle('hidden', filtered.length > 0);

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card' + (selectedProducts.has(p.id) ? ' selected' : '');
    card.dataset.id = p.id;
    card.dataset.category = p.category;
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', p.name);
    card.setAttribute('tabindex', '0');

    const heroHTML = p.image
      ? `<img class="card-product-img" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        + `<span class="card-emoji card-emoji-fallback" aria-hidden="true" style="display:none">${p.emoji}</span>`
      : `<span class="card-emoji" aria-hidden="true">${p.emoji}</span>`;

    card.innerHTML = `
      <div class="card-check" aria-hidden="true">✓</div>
      <div class="card-hero">
        ${heroHTML}
      </div>
      <div class="card-body">
        <span class="card-category-tag">${p.category}</span>
        <h3 class="card-name">${p.name}</h3>
        <p class="card-tagline">${p.tagline}</p>
      </div>
      <div class="card-actions">
        <button class="card-info-btn" data-id="${p.id}" aria-label="View details for ${p.name}">
          View Details
        </button>
      </div>`;

    // Click card body = toggle selection
    card.addEventListener('click', e => {
      if (e.target.closest('.card-info-btn')) return;
      toggleProduct(p.id);
    });

    // Keyboard support
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleProduct(p.id);
      }
    });

    // Details button opens modal
    card.querySelector('.card-info-btn').addEventListener('click', e => {
      e.stopPropagation();
      openModal(p.id);
    });

    productGrid.appendChild(card);
  });
}

// ── Selection ─────────────────────────────────────────────────
function toggleProduct(id) {
  if (selectedProducts.has(id)) {
    selectedProducts.delete(id);
  } else {
    selectedProducts.add(id);
  }
  saveSelection();
  updateCardSelected(id);
  renderSelectedList();
  updateModalButton(id);
}

function updateCardSelected(id) {
  const card = productGrid.querySelector(`[data-id="${id}"]`);
  if (card) card.classList.toggle('selected', selectedProducts.has(id));
}

function renderSelectedList() {
  const count = selectedProducts.size;
  selectedCount.textContent = count;
  generateBtn.disabled = count === 0;

  selectedList.innerHTML = '';

  if (count === 0) {
    selectedList.appendChild(emptyHint.cloneNode(true));
    document.getElementById('empty-hint').style.display = '';
    return;
  }

  selectedProducts.forEach(id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;

    const chip = document.createElement('div');
    chip.className = 'selected-chip';
    chip.setAttribute('role', 'listitem');
    chip.innerHTML = `
      <span class="chip-emoji" aria-hidden="true">${p.emoji}</span>
      <span class="chip-name" title="${p.name}">${p.name}</span>
      <button class="chip-remove" aria-label="Remove ${p.name}" data-id="${p.id}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;

    chip.querySelector('.chip-remove').addEventListener('click', () => toggleProduct(id));
    selectedList.appendChild(chip);
  });
}

// ── localStorage ──────────────────────────────────────────────
function saveSelection() {
  localStorage.setItem(LS_KEY, JSON.stringify([...selectedProducts]));
}

function loadSelection() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    const validIds = new Set(PRODUCTS.map(p => p.id));
    saved.filter(id => validIds.has(id)).forEach(id => selectedProducts.add(id));
  } catch {
    /* ignore corrupt data */
  }
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  currentModalProductId = id;

  const isSelected = selectedProducts.has(id);
  const modalHero = p.image
    ? `<img class="modal-product-img" src="${p.image}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
      + `<span class="modal-emoji" aria-hidden="true" style="display:none">${p.emoji}</span>`
    : `<span class="modal-emoji" aria-hidden="true">${p.emoji}</span>`;

  modalContent.innerHTML = `
    ${modalHero}
    <p class="modal-category">${p.category}</p>
    <h2 id="modal-product-name">${p.name}</h2>
    <p class="modal-brand">${p.brand}</p>
    <p class="modal-description">${p.description}</p>
    <div class="modal-ingredients">
      <h4>Key Ingredients</h4>
      <div class="ingredient-tags">
        ${p.keyIngredients.map(i => `<span class="ingredient-tag">${i}</span>`).join('')}
      </div>
    </div>
    <p class="modal-skin-type"><strong>Best for:</strong> ${p.skinType}</p>
    <button class="modal-select-btn ${isSelected ? 'remove' : 'add'}" id="modal-select-btn">
      ${isSelected ? '✕ Remove from Routine' : '+ Add to Routine'}
    </button>`;

  document.getElementById('modal-select-btn').addEventListener('click', () => {
    toggleProduct(id);
    closeModal();
  });

  productModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  productModal.classList.add('hidden');
  document.body.style.overflow = '';
  currentModalProductId = null;
}

function updateModalButton(id) {
  if (currentModalProductId !== id) return;
  const btn = document.getElementById('modal-select-btn');
  if (!btn) return;
  const isSelected = selectedProducts.has(id);
  btn.className = `modal-select-btn ${isSelected ? 'remove' : 'add'}`;
  btn.textContent = isSelected ? '✕ Remove from Routine' : '+ Add to Routine';
}

// ── Routine generation ────────────────────────────────────────
async function generateRoutine() {
  if (selectedProducts.size === 0) return;

  const products = [...selectedProducts].map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  const productData = products.map(p => ({
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description,
    keyIngredients: p.keyIngredients,
    skinType: p.skinType
  }));

  const displayText = `✨ Generate my personalised routine using ${products.length} selected product${products.length !== 1 ? 's' : ''}:\n${products.map(p => `• ${p.emoji} ${p.name}`).join('\n')}`;
  const apiText = `Please create a personalised beauty routine using these L'Oréal products I've selected:\n\n${JSON.stringify(productData, null, 2)}\n\nOrganise as Morning Routine / Evening Routine / Weekly Treatments where applicable. Include the correct application order, how much to use, and any important tips or ingredient synergies. Use numbered steps and clear headings.`;

  appendMessage('user', displayText);
  conversationHistory.push({ role: 'user', content: apiText });

  // Scroll chat into view
  document.querySelector('.chat-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

  await callWorker();
}

// ── Chat ──────────────────────────────────────────────────────
function appendMessage(role, text) {
  const isUser = role === 'user';
  const row = document.createElement('div');
  row.className = 'message' + (isUser ? ' user-message' : '');

  const avatar = document.createElement('div');
  avatar.className = 'avatar ' + (isUser ? 'user-avatar' : 'assistant-avatar');
  avatar.textContent = isUser ? 'Y' : 'L';

  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + (isUser ? 'user-bubble' : 'assistant-bubble');
  bubble.innerHTML = formatText(text);

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatWindow.appendChild(row);
  mainScroll.scrollTop = mainScroll.scrollHeight;
}

function setLoading(loading) {
  sendBtn.disabled = loading;
  generateBtn.disabled = loading || selectedProducts.size === 0;
  typingIndicator.classList.toggle('hidden', !loading);
  if (loading) mainScroll.scrollTop = mainScroll.scrollHeight;
}

async function callWorker() {
  setLoading(true);
  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory, webSearch: webSearchEnabled }),
    });

    if (!res.ok) throw new Error(`Worker returned HTTP ${res.status}`);

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Unknown API error');

    const reply = data.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content: reply });
    appendMessage('assistant', reply);

  } catch (err) {
    console.error('Chat error:', err);
    appendMessage('assistant',
      "I'm sorry, I'm having trouble connecting right now. " +
      "Please ensure the Cloudflare Worker is deployed and try again.");
  } finally {
    setLoading(false);
    userInput.focus();
  }
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || sendBtn.disabled) return;
  userInput.value = '';
  appendMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });
  await callWorker();
}

// ── Category filters ──────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    renderProducts();
  });
});

// ── Search ────────────────────────────────────────────────────
productSearch.addEventListener('input', () => {
  currentSearch = productSearch.value;
  renderProducts();
});

// ── Clear all ─────────────────────────────────────────────────
clearAllBtn.addEventListener('click', () => {
  selectedProducts.clear();
  saveSelection();
  renderProducts();
  renderSelectedList();
});

// ── Generate routine ──────────────────────────────────────────
generateBtn.addEventListener('click', generateRoutine);

// ── Send message ──────────────────────────────────────────────
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ── Modal close ───────────────────────────────────────────────
modalClose.addEventListener('click', closeModal);
productModal.addEventListener('click', e => { if (e.target === productModal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Web search toggle ─────────────────────────────────────────
webSearchToggle.addEventListener('click', () => {
  webSearchEnabled = !webSearchEnabled;
  webSearchToggle.classList.toggle('active', webSearchEnabled);
  webSearchToggle.setAttribute('aria-pressed', webSearchEnabled);
  appendMessage('assistant',
    webSearchEnabled
      ? 'Web search is now **enabled**. My responses will include up-to-date information and source links.'
      : 'Web search is now **disabled**. I\'ll use my built-in L\'Oréal knowledge to assist you.'
  );
});

// ── RTL toggle ────────────────────────────────────────────────
rtlToggle.addEventListener('click', () => {
  const isRtl = document.documentElement.dir === 'rtl';
  document.documentElement.dir = isRtl ? 'ltr' : 'rtl';
  rtlToggle.classList.toggle('active', !isRtl);
  rtlToggle.setAttribute('aria-pressed', !isRtl);
});

// ── Init ──────────────────────────────────────────────────────
(function init() {
  loadSelection();
  renderProducts();
  renderSelectedList();

  appendMessage('assistant',
    "Welcome to L'Oréal's Routine Builder & Beauty Advisor! ✨\n\n" +
    "Browse the product catalogue above and click any card to add it to your routine. " +
    "Once you've chosen your products, hit **Generate My Routine** and I'll build a personalised step-by-step plan just for you.\n\n" +
    "You can also ask me anything about skincare, haircare, makeup, or beauty ingredients — I'm here to help!"
  );

  userInput.focus();
})();
