/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const workerUrl = "https://withered-surf-0e92.gpierce4752.workers.dev/";
const historyKey = "lorealChatHistory";

let conversationHistory = [];
const savedHistory = localStorage.getItem(historyKey);

if (savedHistory) {
  try {
    const parsedHistory = JSON.parse(savedHistory);

    if (Array.isArray(parsedHistory)) {
      conversationHistory = parsedHistory;
    }
  } catch (error) {
    console.error("Could not load saved chat history:", error);
  }
}

function saveConversationHistory() {
  localStorage.setItem(historyKey, JSON.stringify(conversationHistory));
}

// Add a clearly labeled message to the chat window.
function addMessage(sender, message, messageClass) {
  const messageElement = document.createElement("p");
  messageElement.className = `msg ${messageClass}`;
  messageElement.textContent = `${sender}: ${message}`;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return messageElement;
}

// Display only the latest question and response while keeping all history for context.
const latestQuestionIndex = conversationHistory
  .map((savedMessage) => savedMessage.role)
  .lastIndexOf("user");
const latestQuestion = conversationHistory[latestQuestionIndex];
const latestResponse = conversationHistory[latestQuestionIndex + 1];

if (latestQuestion && latestResponse?.role === "assistant") {
  addMessage("You", latestQuestion.content, "user");
  addMessage("Assistant", latestResponse.content, "ai");
} else {
  addMessage("Assistant", "👋 Hello! How can I help you today?", "ai");
}

/* Send the user's question to the class-hosted Cloudflare Worker */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = userInput.value.trim();

  if (!message) {
    return;
  }

  // Start a fresh visible turn; the complete history remains available to the API.
  chatWindow.textContent = "";
  addMessage("You", message, "user");
  conversationHistory.push({ role: "user", content: message });
  saveConversationHistory();

  const thinkingMessage = addMessage("Assistant", "Thinking...", "ai");

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationHistory,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(
        data.error?.message || `Request failed with status ${response.status}`,
      );
    }

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("The chatbot returned an unexpected response.");
    }

    const reply = data.choices[0].message.content;

    thinkingMessage.textContent = `Assistant: ${reply}`;
    conversationHistory.push({ role: "assistant", content: reply });
    saveConversationHistory();
    userInput.value = "";
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error("Could not contact the chatbot:", error);
    thinkingMessage.textContent = `Assistant: ${error.message}`;
  }
});
