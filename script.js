// Cloudflare Worker endpoint
const WORKER_URL = "https://wanderbot.bahfu.workers.dev/";

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const statusArea = document.getElementById("statusArea");

// Start message
chatWindow.innerHTML = `<div class="msg ai">👋 Hi! I’m your L’Oréal Assistant. Ask me about skincare, makeup, haircare, or fragrances!</div>`;

const conversation = [
  {
    role: "system",
    content:
      "You are L’Oréal Assistant — a beauty expert chatbot. Help users find L’Oréal products, routines, and beauty advice. If asked unrelated questions, politely refuse.",
  },
];

function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;
  msg.innerHTML = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Submit handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  // Show user message
  addMessage("user", message);
  conversation.push({ role: "user", content: message });
  userInput.value = "";

  // Show "thinking..."
  const thinking = document.createElement("div");
  thinking.className = "msg ai";
  thinking.textContent = "Thinking... 💭";
  chatWindow.appendChild(thinking);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Send to Worker
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation }),
    });

    // Show status
    statusArea.innerHTML =
      res.status === 200
        ? `<div class="status success">200 ✅ Connected</div>`
        : `<div class="status error">${res.status} ❌ Error</div>`;

    const data = await res.json();

    thinking.remove();
    const reply = data.reply || "Sorry, I couldn’t generate a response.";
    addMessage("ai", reply);
    conversation.push({ role: "assistant", content: reply });
  } catch (err) {
    thinking.remove();
    statusArea.innerHTML = `<div class="status error">⚠️ ${err.message}</div>`;
    addMessage("ai", "Sorry — something went wrong. Try again.");
  }
});
