const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");

const WORKER_URL =
  "https://delicate-lake-1906.larissafagundes38.workers.dev/";

const messages = [
  {
    role: "system",
    content:
      "You are a helpful L’Oréal beauty assistant. Only answer questions related to L’Oréal products, skincare, makeup, haircare, fragrance, beauty routines, recommendations, and beauty-related topics. If the user asks about something unrelated, politely refuse and explain that you only assist with L’Oréal and beauty topics. Keep responses helpful and concise."
  }
];

addMessage(
  "ai",
  "Hello! I’m your L’Oréal Beauty Assistant. Ask me about skincare, makeup, haircare, fragrance, or beauty routines."
);

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  latestQuestion.textContent = `Latest question: ${text}`;

  messages.push({
    role: "user",
    content: text
  });

  userInput.value = "";
  userInput.disabled = true;

  showTyping();

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();

    removeTyping();

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        data?.details?.error?.message ||
        data?.details ||
        data?.error ||
        "There was a problem connecting to the chatbot.";

      addMessage("ai", `Sorry, something went wrong: ${errorMessage}`);
      console.error("Worker/API error:", data);
      return;
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response right now.";

    addMessage("ai", reply);

    messages.push({
      role: "assistant",
      content: reply
    });
  } catch (error) {
    removeTyping();
    addMessage(
      "ai",
      "Sorry, I’m having trouble connecting right now. Please try again in a moment."
    );
    console.error("Chatbot error:", error);
  } finally {
    userInput.disabled = false;
    userInput.focus();
  }
});

function addMessage(role, text) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const bubble = document.createElement("div");
  bubble.className = `msg ${role}`;

  if (role === "ai") {
    bubble.innerHTML = formatMessage(text);
  } else {
    bubble.textContent = text;
  }

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  scrollToBottom();
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function showTyping() {
  removeTyping();

  const row = document.createElement("div");
  row.className = "message-row ai";
  row.id = "typingRow";

  const bubble = document.createElement("div");
  bubble.className = "msg ai typing";
  bubble.textContent = "Typing...";

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  const typingRow = document.getElementById("typingRow");
  if (typingRow) {
    typingRow.remove();
  }
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}