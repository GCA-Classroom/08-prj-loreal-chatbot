/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestionText = document.getElementById("latestQuestionText");

// System prompt that keeps the chatbot focused on L'Oreal beauty topics only.
const SYSTEM_PROMPT = `You are a helpful L'Oreal beauty advisor.
Only answer questions about L'Oreal products, beauty routines, ingredients, shades, and recommendations.
If the user asks for anything outside L'Oreal or outside beauty topics, do not answer that request.
Politely refuse in one short sentence, then offer to help with L'Oreal products, routines, or recommendations.
Never provide non-beauty help such as travel, coding, finance, medical diagnosis, legal advice, or general trivia.
Keep responses clear, friendly, and concise.`;

// Friendly fallback shown when the user asks an off-topic question.
const OFF_TOPIC_REPLY =
  "I can only help with L'Oreal products, beauty routines, and recommendations. Ask me a L'Oreal beauty question and I'll be happy to help.";

// Save user profile details for multi-turn context.
const userProfile = {
  name: null,
  pastQuestions: [],
};

// Simple keyword check to block clearly unrelated questions before calling the API.
function isLorealBeautyQuestion(text) {
  const normalizedText = text.toLowerCase();

  const beautyKeywords = [
    "loreal",
    "l'oreal",
    "skin",
    "skincare",
    "hair",
    "makeup",
    "routine",
    "serum",
    "cleanser",
    "moisturizer",
    "foundation",
    "mascara",
    "lip",
    "sunscreen",
    "shade",
    "beauty",
    "product",
  ];

  return beautyKeywords.some((keyword) => normalizedText.includes(keyword));
}

// Extract a name when users share it naturally, e.g. "my name is Maya".
function extractNameFromMessage(text) {
  const match = text.match(/(?:my name is|i am|i'm)\s+([a-zA-Z][a-zA-Z\-']{1,30})/i);
  return match ? match[1] : null;
}

// Build a short context note to help the assistant remember name + recent questions.
function buildConversationContextMessage() {
  const recentQuestions = userProfile.pastQuestions.slice(-3).join(" | ");
  const namePart = userProfile.name ? `User name: ${userProfile.name}.` : "User name: unknown.";
  const questionPart = recentQuestions
    ? `Recent user questions: ${recentQuestions}.`
    : "Recent user questions: none yet.";

  return {
    role: "system",
    content: `${namePart} ${questionPart} Use this context to keep replies natural and consistent.`,
  };
}

// Store the conversation so the chatbot remembers previous turns.
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

// Add a message to the chat window using existing CSS classes (.msg, .user, .ai).
function addMessageToChat(text, role) {
  const messageEl = document.createElement("div");
  messageEl.className = `msg ${role}`;
  messageEl.textContent = text;
  chatWindow.appendChild(messageEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Clear any placeholder content and show a friendly first assistant message.
chatWindow.innerHTML = "";
addMessageToChat(
  "Hello! Ask me anything about L'Oreal products and routines.",
  "ai",
);

// Send the current conversation to OpenAI and return the assistant text.
async function getChatbotReply() {
  const apiMessages = [...messages, buildConversationContextMessage()];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: apiMessages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const apiError = data?.error?.message || "OpenAI request failed.";
    throw new Error(apiError);
  }

  // Classroom note: read the assistant text from data.choices[0].message.content
  const reply = data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error("No response content returned from the API.");
  }

  return reply;
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  latestQuestionText.textContent = userMessage;
  latestQuestionText.classList.add("is-visible");

  const detectedName = extractNameFromMessage(userMessage);
  if (detectedName) {
    userProfile.name = detectedName;
  }

  userProfile.pastQuestions.push(userMessage);

  // Show the user's message in the UI.
  addMessageToChat(userMessage, "user");

  if (
    !OPENAI_API_KEY ||
    OPENAI_API_KEY.includes("paste-your-openai-api-key-here")
  ) {
    addMessageToChat(
      "Please add your OpenAI API key in secrets.js first.",
      "ai",
    );
    return;
  }

  // If the question is clearly unrelated, refuse politely without using the API.
  if (!isLorealBeautyQuestion(userMessage)) {
    addMessageToChat(OFF_TOPIC_REPLY, "ai");
    userInput.value = "";
    userInput.focus();
    return;
  }

  // Add the user's message to the API conversation history.
  messages.push({ role: "user", content: userMessage });

  userInput.value = "";
  sendBtn.disabled = true;

  // Temporary loading message while waiting for OpenAI.
  const loadingEl = document.createElement("div");
  loadingEl.className = "msg ai";
  loadingEl.textContent = "Thinking...";
  chatWindow.appendChild(loadingEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const assistantReply = await getChatbotReply();

    // Remove loading state and show the final assistant response.
    loadingEl.remove();
    addMessageToChat(assistantReply, "ai");

    // Save assistant reply in history for next turn.
    messages.push({ role: "assistant", content: assistantReply });
  } catch (error) {
    loadingEl.remove();
    addMessageToChat(`Sorry, something went wrong: ${error.message}`, "ai");
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
