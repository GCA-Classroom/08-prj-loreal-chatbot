/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* Cloudflare Worker endpoint from secrets.js */
const WORKER_URL =
  window.APP_CONFIG?.WORKER_URL || "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE";

// Store full conversation so each request includes prior context
const messages = [
  {
    role: "system",
    content:
      "You are a helpful L'Oreal beauty advisor. Keep advice beginner-friendly and practical.",
  },
];

// Add one message block to the chat window
function addMessage(role, content) {
  const messageEl = document.createElement("p");
  messageEl.className = `msg ${role}`;

  if (role === "user") {
    messageEl.textContent = `You: ${content}`;
  } else {
    messageEl.textContent = `Beauty Advisor: ${content}`;
  }

  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Set initial greeting message
addMessage("ai", "Hello. How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();

  if (!message) {
    return;
  }

  // Show the user's message immediately
  addMessage("user", message);
  userInput.value = "";

  // Add user message to history for API context
  messages.push({ role: "user", content: message });

  const typingEl = document.createElement("p");
  typingEl.className = "msg ai";
  typingEl.textContent = "Beauty Advisor: Thinking...";
  chatWindow.appendChild(typingEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Chat Completions response text
    const aiReply =
      data.choices?.[0]?.message?.content || "No response received.";

    // Save assistant reply in history and display it
    messages.push({ role: "assistant", content: aiReply });
    typingEl.remove();
    addMessage("ai", aiReply);
  } catch (error) {
    console.error("Request failed:", error);
    typingEl.textContent =
      "Beauty Advisor: Something went wrong. Check your Worker URL and try again.";
  }
});
