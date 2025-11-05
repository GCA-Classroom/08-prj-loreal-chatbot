const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// ✅ Your deployed Cloudflare Worker URL
const WORKER_URL = "https://wanderbot-worker.fatoumata6871.workers.dev/";

let messages = [
  {
    role: "system",
    content: "You are a friendly skincare and product advisor.",
  },
];

// Append messages to chat
function appendMessage(role, content) {
  const msg = document.createElement("div");
  msg.classList.add("msg", role);
  msg.textContent = content;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* —— Handle chat input —— */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMsg = userInput.value.trim();
  if (!userMsg) return;

  // show user message
  appendMessage("user", userMsg);
  userInput.value = "";

  messages.push({ role: "user", content: userMsg });

  // placeholder while waiting
  appendMessage("ai", "💭 Thinking...");

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();
    const aiMsg = data.content || data.error || "⚠️ No response from AI.";

    chatWindow.lastChild.textContent = aiMsg;
    messages.push({ role: "assistant", content: aiMsg });
  } catch (err) {
    chatWindow.lastChild.textContent = "❌ Something went wrong. Try again.";
    console.error("Fetch error:", err);
  }
});
