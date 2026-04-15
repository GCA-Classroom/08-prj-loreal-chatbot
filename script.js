const WORKER_URL = "https://loreal-chatbot-worker.daddykeat.workers.dev";

const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

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

function createMessage(text, sender) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message");

  if (sender === "user") {
    wrapper.classList.add("user-message");
  } else {
    wrapper.classList.add("bot-message");
  }

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
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

async function sendMessage(message) {
  addTyping();

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    removeTyping();

    const reply =
      data.choices?.[0]?.message?.content ||
      data.response ||
      data.reply ||
      data.error ||
      "Sorry, I couldn’t generate a response.";

    addMessage(reply, "bot");
  } catch (error) {
    removeTyping();
    console.error("Chatbot error:", error);
    addMessage("Sorry, there was an error connecting to the assistant.", "bot");
  }
}

chatForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";

  sendMessage(message);
});

window.addEventListener("DOMContentLoaded", () => {
  addMessage(
    "Hi! I’m your L'Oréal Beauty Assistant. Ask me about skincare, haircare, makeup, fragrance, or routines.",
    "bot"
  );
});