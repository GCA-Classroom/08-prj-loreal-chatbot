/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

// Your Cloudflare Worker endpoint for OpenAI requests.
const workerURL = "https://odd-shape-ef00.taylorramirez2005.workers.dev/";

/*
  System prompt:
  Keeps the chatbot focused only on L'Oreal products, routines, and recommendations.
*/
const SYSTEM_PROMPT =
  "You are the L'Oreal Product Advisor. You may only answer questions related to L'Oreal products, beauty routines, product recommendations, ingredients, shade selection, haircare, skincare, makeup, fragrance, and beauty usage tips. If a question is unrelated to L'Oreal or unrelated to beauty topics, politely refuse. Use this exact style for refusal: 'I can only help with L'Oreal products and beauty-related questions. Please ask me about products, routines, or recommendations.' Keep refusals short and friendly.";

// Store chat history so each request sends context in the required `messages` format.
const messages = [
  { role: "system", content: SYSTEM_PROMPT },
  {
    role: "assistant",
    content:
      "Hello! I can help with L'Oreal products, routines, and recommendations. What would you like help with today?",
  },
];

// Light-weight memory for natural multi-turn conversations.
const conversationState = {
  userName: "",
  pastQuestions: [],
};
let typingIndicatorEl = null;

// Render the first assistant message in the chat UI.
appendMessage("ai", messages[1].content);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const prompt = userInput.value.trim();
  if (!prompt) {
    return;
  }

  updateLatestQuestion(prompt);
  updateConversationState(prompt);

  appendMessage("user", prompt);
  messages.push({ role: "user", content: prompt });

  userInput.value = "";
  userInput.focus();
  setLoadingState(true);
  showTypingIndicator();

  try {
    const reply = await getChatCompletion(getMessagesWithContext());

    removeTypingIndicator();
    appendMessage("ai", reply);
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    removeTypingIndicator();
    console.error("Chat request failed:", error);
    appendMessage(
      "ai",
      "Sorry, I could not get a response right now. Please check your API setup and try again.",
    );
  } finally {
    setLoadingState(false);
  }
});

/*
  Sends the `messages` array to your deployed Cloudflare Worker.
  The Worker securely calls OpenAI using the server-side API key.
*/
async function getChatCompletion(conversationMessages) {
  const endpoint = workerURL;

  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "gpt-4o",
      messages: conversationMessages,
      max_completion_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const aiMessage = data.choices?.[0]?.message?.content;

  if (!aiMessage) {
    throw new Error("No message content returned by API");
  }

  return aiMessage.trim();
}

// Builds a short context message so the assistant remembers user details.
function getMessagesWithContext() {
  const memoryParts = [];

  if (conversationState.userName) {
    memoryParts.push(`User name: ${conversationState.userName}`);
  }

  if (conversationState.pastQuestions.length > 0) {
    memoryParts.push(
      `Past user questions: ${conversationState.pastQuestions.join(" | ")}`,
    );
  }

  if (memoryParts.length === 0) {
    return messages;
  }

  const memoryMessage = {
    role: "system",
    content: `Conversation context for continuity: ${memoryParts.join(". ")}`,
  };

  return [...messages, memoryMessage];
}

function updateLatestQuestion(questionText) {
  latestQuestion.textContent = questionText;
}

function updateConversationState(questionText) {
  const name = extractName(questionText);
  if (name) {
    conversationState.userName = name;
  }

  conversationState.pastQuestions.push(questionText);

  // Keep only the most recent questions to limit token usage.
  if (conversationState.pastQuestions.length > 6) {
    conversationState.pastQuestions.shift();
  }
}

function extractName(text) {
  const match = text.match(
    /(?:my name is|i am|i'm)\s+([a-zA-Z][a-zA-Z\-']{1,30})/i,
  );
  return match ? capitalizeName(match[1]) : "";
}

function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Creates one chat row and keeps the scroll at the latest message.
function appendMessage(role, text) {
  const msg = document.createElement("div");
  msg.classList.add("msg", role);

  const speaker = role === "user" ? "You" : "L'Oreal Advisor";

  const bubble = document.createElement("div");
  bubble.classList.add("msg-bubble");
  bubble.textContent = `${speaker}: ${text}`;

  msg.appendChild(bubble);

  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return msg;
}

function showTypingIndicator() {
  removeTypingIndicator();
  typingIndicatorEl = appendMessage("ai", "L'Oreal Advisor is typing...");
  typingIndicatorEl.classList.add("typing-indicator");
}

function removeTypingIndicator() {
  if (typingIndicatorEl && typingIndicatorEl.parentNode) {
    typingIndicatorEl.parentNode.removeChild(typingIndicatorEl);
  }
  typingIndicatorEl = null;
}

function setLoadingState(isLoading) {
  sendBtn.disabled = isLoading;
  sendBtn.setAttribute("aria-busy", String(isLoading));
}
