
/* ===== L'OREAL BEAUTY ASSISTANT ===== */

// Replace this with your actual Cloudflare Worker URL
const WORKER_URL =
   "08-prj-loreal-chatbot.jialiyahdukes.workers.dev";
;

// HTML Elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

const latestQuestion = document.getElementById("latestQuestion");
const latestQuestionText =
  document.getElementById("latestQuestionText");

const suggestionButtons =
  document.querySelectorAll(".suggestion-btn");

// Stores messages for the AI to remember
const conversationHistory = [];

// Add a message bubble to the conversation
function addMessage(text, sender) {
  const bubble = document.createElement("div");

  bubble.classList.add("msg", sender);
  bubble.textContent = text;

  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return bubble;
}

// Display only the newest question in the summary
function updateLatestQuestion(question) {
  latestQuestionText.textContent = question;
  latestQuestion.hidden = false;
}

// Welcome message
addMessage(
  "Hi beautiful! 💗 Welcome to your L'Oréal Beauty " +
  "Assistant. Tell me about your beauty goals, " +
  "and I'll help you explore skincare, makeup, " +
  "and haircare recommendations!",
  "ai"
);

// Send message to AI
async function sendMessage(question) {
  const userMessage = question.trim();

  if (!userMessage || sendBtn.disabled) return;

  // Update latest question (replaces previous question)
  updateLatestQuestion(userMessage);

  // Display user bubble
  addMessage(userMessage, "user");

  userInput.value = "";
  sendBtn.disabled = true;
  userInput.disabled = true;

  const loadingBubble = addMessage(
    "✨ Thinking of the perfect recommendation...",
    "ai"
  );

  try {
    // Send previous conversation + newest question
    const requestMessages = [
      ...conversationHistory,
      {
        role: "user",
        content: userMessage
      }
    ];

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: requestMessages
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(
        data.error?.message ||
        (typeof data.error === "string" ? data.error : "") ||
        "Unable to connect to the chatbot."
      );
    }

    const aiReply =
      data.choices?.[0]?.message?.content;

    if (!aiReply) {
      throw new Error("No AI response received.");
    }

    // Replace loading message with AI response
    loadingBubble.textContent = aiReply;

    // Save the conversation for follow-up questions
    conversationHistory.push(
      {
        role: "user",
        content: userMessage
      },
      {
        role: "assistant",
        content: aiReply
      }
    );

    // Limit conversation to the most recent 30 messages
    if (conversationHistory.length > 30) {
      conversationHistory.splice(
        0,
        conversationHistory.length - 30
      );
    }

  } catch (error) {
    console.error("Chatbot Error:", error);

    loadingBubble.textContent =
      "Sorry, beautiful! 💗 I'm having trouble " +
      "connecting right now. Please try again.";

  } finally {
    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();

    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

// Submit a typed question
chatForm.addEventListener("submit", function(event) {
  event.preventDefault();
  sendMessage(userInput.value);
});

// Suggested question buttons
suggestionButtons.forEach(function(button) {
  button.addEventListener("click", function() {
    sendMessage(button.dataset.question || "");
  });
});
