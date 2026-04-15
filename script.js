const WORKER_URL = "https://loreal-chatbot-worker.daddykeat.workers.dev";

const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

/* 🧠 Conversation memory */
let conversation = [
  {
    role: "system",
    content: "You are a helpful L'Oréal Beauty Assistant."
  }
];

/* —— formatting —— */
function formatMessage(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^- (.*)$/gm, "• $1")
    .replace(/\n/g, "<br>");
}

/* —— UI message creation —— */
function createMessage(text, sender) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message");

  if (sender === "user") wrapper.classList.add("user-message");
  else wrapper.classList.add("bot-message");

  const label = document.createElement("div");
  label.classList.add("message-label");
  label.textContent = sender === "user" ? "You" : "L'Oréal Assistant";

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");
  bubble.innerHTML = formatMessage(text);

  wrapper.appendChild(label);
  wrapper.appendChild(bubble);

  return wrapper;
}

function addMessage(text, sender) {
  const messageEl = createMessage(text, sender);
  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* —— typing indicator —— */
function addTyping() {
  const typing = document.createElement("div");
  typing.id = "typing";
  typing.classList.add("message", "bot-message");

  const label = document.createElement("div");
  label.classList.add("message-label");
  label.textContent = "L'Oréal Assistant";

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble", "typing");
  bubble.textContent = "Typing...";

  typing.appendChild(label);
  typing.appendChild(bubble);
  chatWindow.appendChild(typing);
}

function removeTyping() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

/* —— send message —— */
async function sendMessage(message) {
  addTyping();

  try {
    // 🧠 add user message to memory
    conversation.push({
      role: "user",
      content: message
    });

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversation   // 🔥 SEND FULL HISTORY
      })
    });

    const data = await response.json();
    removeTyping();

    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response.";

    // 🧠 store AI reply
    conversation.push({
      role: "assistant",
      content: reply
    });

    addMessage(reply, "bot");

  } catch (error) {
    removeTyping();
    console.error(error);
    addMessage("Error connecting to assistant.", "bot");
  }
}

/* —— form submit —— */
chatForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";

  sendMessage(message);
});

/* —— initial greeting —— */
window.addEventListener("DOMContentLoaded", () => {
  const greeting =
    "Hi! I’m your L'Oréal Beauty Assistant. Ask me about skincare, haircare, makeup, fragrance, or routines.";

  addMessage(greeting, "bot");

  // store greeting in memory
  conversation.push({
    role: "assistant",
    content: greeting
  });
});