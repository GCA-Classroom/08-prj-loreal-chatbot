/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Cloudflare Worker endpoint (server-side holds the OpenAI key)
const CLOUDFLARE_WORKER_URL =
  "https://lorealchatbot.maddi-ceriani.workers.dev/";

// Conversation state and persistence
const STORAGE_KEY = "loreal_chat_conversation_v1";
let conversation = {
  // messages will be an array of { role: 'system'|'user'|'assistant', content: '...' }
  messages: [],
  // context holds extracted information such as userName
  context: {},
};

function saveConversation() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  } catch (e) {
    // ignore storage errors
    console.warn("Could not save conversation to localStorage", e);
  }
}

function loadConversation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // basic validation
      if (parsed && Array.isArray(parsed.messages)) {
        conversation = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn("Failed to load conversation", e);
  }

  // initialize with system prompt + friendly assistant greeting
  conversation = {
    messages: [
      { role: "system", content: buildSystemPrompt() },
      {
        role: "assistant",
        content:
          "👋 Hello! I can help with L'Oréal products, routines, and recommendations. Ask me anything about L'Oréal brands.",
      },
    ],
    context: {},
  };
  saveConversation();
}

function renderConversation() {
  chatWindow.innerHTML = "";
  conversation.messages.forEach((m) => {
    // do not render system messages
    if (m.role === "system") return;
    const role = m.role === "assistant" ? "ai" : "user";
    appendMessage(role, m.content);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// load existing conversation (or create initial messages)
loadConversation();
renderConversation();

/* Helper to append messages */
function appendMessage(role, text) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  // preserve line breaks
  text = String(text || "");
  const parts = text.split("\n");
  parts.forEach((p, i) => {
    const span = document.createElement("span");
    span.textContent = p;
    el.appendChild(span);
    if (i < parts.length - 1) el.appendChild(document.createElement("br"));
  });
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return el;
}

/* Show / clear the user's latest question above the assistant response
   This element is updated on each new user submission. It is not persisted
   in conversation.messages (it's a UI affordance only).
*/
function showLatestQuestion(text) {
  clearLatestQuestion();
  const el = document.createElement("div");
  el.id = "latestQuestion";
  el.className = "latest-question";
  el.textContent = text;
  // append after the current chat content (after the user's message which was just added)
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function clearLatestQuestion() {
  const existing = document.getElementById("latestQuestion");
  if (existing) existing.remove();
}

/* Disable / enable input while waiting */
function setInputEnabled(enabled) {
  userInput.disabled = !enabled;
  const btn = document.getElementById("sendBtn");
  if (btn) btn.disabled = !enabled;
}

/* Build system prompt to enforce L'Oréal-only answers and style */
function buildSystemPrompt() {
  return (
    "You are a helpful, concise assistant that only answers questions about L'Oréal and its brands (for example: L'Oréal Paris, Kérastase, SkinCeuticals, Lancôme, Garnier, Maybelline, NYX, etc.). " +
    'If a user asks about a topic not related to L\'Oréal products, routines, or recommendations, reply exactly: "I can only answer questions about L’Oréal products, routines, and recommendations.". ' +
    "Provide brand-consistent, friendly recommendations, suggest suitable L'Oréal products where appropriate, and keep answers concise. Avoid medical or legal advice."
  );
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // Append user's message to conversation and UI
  const userMsg = { role: "user", content: text };
  conversation.messages.push(userMsg);
  saveConversation();
  appendMessage("user", text);
  // show the latest question UI above the assistant response (resets each submission)
  showLatestQuestion(text);
  userInput.value = "";

  // Simple name extraction: look for "my name is X" or "I'm X" / "I am X"
  if (!conversation.context.userName) {
    const nameMatch = text.match(
      /\b(?:my name is|i'm|i am)\s+([A-Z][a-z]+)\b/i
    );
    if (nameMatch) {
      const name = nameMatch[1];
      conversation.context.userName = name;
      // add a short system note so the assistant can use the name in future turns
      conversation.messages.splice(1, 0, {
        role: "system",
        content: `User profile: name = ${name}`,
      });
      // local acknowledgement
      const ack = { role: "assistant", content: `Nice to meet you, ${name}!` };
      conversation.messages.push(ack);
      appendMessage("ai", ack.content);
      saveConversation();
      // continue (we still will send the user's question to the API)
    }
  }

  // Show AI loading message (temporary)
  const loadingEl = appendMessage("ai", "…");
  setInputEnabled(false);
  // Send the full conversation (system + history) to the Cloudflare Worker endpoint.
  // The worker (at the provided URL) is expected to forward the request to OpenAI
  // and return a JSON response. This avoids exposing the API key in client code.
  try {
    const resp = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation.messages }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Worker error:", resp.status, errText);
      loadingEl.textContent =
        "Sorry — I couldn't get a response. Please try again later.";
      setInputEnabled(true);
      return;
    }

    const data = await resp.json();

    // Support multiple possible response shapes from the worker
    const aiMsg =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      data?.reply ||
      data?.answer ||
      data?.message?.content ||
      data?.message?.text ||
      null;

    if (!aiMsg) {
      console.warn("Unexpected worker response shape:", data);
      loadingEl.textContent =
        "Sorry — got an unexpected response format from the worker.";
    } else {
      loadingEl.remove();
      appendMessage("ai", aiMsg);
      conversation.messages.push({ role: "assistant", content: aiMsg });
      saveConversation();
    }
  } catch (err) {
    console.error("Request failed", err);
    loadingEl.textContent =
      "Network error — please check your connection and try again.";
  } finally {
    setInputEnabled(true);
  }
});
