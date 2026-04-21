/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const userQuestionDisplay = document.getElementById("userQuestion");

/* L'Oréal System Prompt - guides AI to only answer L'Oréal related questions */
const SYSTEM_PROMPT = `You are an expert L'Oréal Beauty Advisor. Your role is to help customers discover their perfect beauty routine by recommending L'Oréal and Lancôme products, including makeup, skincare, haircare, and fragrances. 

You have extensive knowledge of:
- L'Oréal Paris product lines (Color Riche, Hyaluronic Acid, True Match, etc.)
- Lancôme luxury beauty products
- Skincare routines tailored to different skin types
- Makeup techniques and product recommendations
- Haircare solutions for various hair concerns
- Fragrance collections

When answering questions:
1. Always provide personalized recommendations based on customer needs
2. Explain product benefits in detail
3. Suggest complementary products for complete routines
4. Be friendly and encouraging

For questions unrelated to L'Oréal products, routines, or beauty recommendations, politely decline to answer and redirect the conversation back to beauty and L'Oréal products. Say something like: "I'm here to help with L'Oréal products and beauty routines. How can I assist you with your beauty needs?"`;

// Cloudflare Worker endpoint URL - Update this with your deployed worker URL
const CLOUDFLARE_WORKER_URL = "https://your-cloudflare-worker-url.workers.dev";

/* Chat History - Maintains conversation context for multi-turn interactions */
let chatHistory = [
  {
    role: "assistant",
    content:
      "👋 Hello! I'm your L'Oréal Beauty Advisor. Ask me about skincare, makeup, haircare, fragrances, or anything related to our products and beauty routines. What beauty concern can I help you with today?",
  },
];

/* Initialize chat window with welcome message */
function initializeChat() {
  chatWindow.innerHTML = "";
  displayMessage(chatHistory[0].content, "ai");
}

/* Displays a single message in the chat window */
function displayMessage(content, role) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msg", role);

  const bubble = document.createElement("div");
  bubble.classList.add("msg-bubble");
  bubble.textContent = content;

  msgDiv.appendChild(bubble);
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Displays the user's latest question above the chat */
function displayUserQuestion(question) {
  userQuestionDisplay.textContent = `❓ You asked: ${question}`;
}

/* Sends message to Cloudflare Worker and gets AI response */
async function sendMessageToAI(userMessage) {
  try {
    // Add user message to chat history
    chatHistory.push({
      role: "user",
      content: userMessage,
    });

    // Prepare request body with system prompt and message history
    const requestBody = {
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...chatHistory],
    };

    // Send request to Cloudflare Worker
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract AI response from OpenAI API response format
    const aiMessage = data.choices[0].message.content;

    // Add AI response to chat history
    chatHistory.push({
      role: "assistant",
      content: aiMessage,
    });

    // Display AI response in chat window
    displayMessage(aiMessage, "ai");
  } catch (error) {
    console.error("Error communicating with API:", error);
    displayMessage(
      "❌ I encountered an error connecting to the beauty database. Please try again shortly or check your Cloudflare Worker configuration. Make sure CLOUDFLARE_WORKER_URL is set correctly in script.js and your worker has the OPENAI_API_KEY secret configured.",
      "ai",
    );
  }
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input
  const userMessage = userInput.value.trim();

  if (!userMessage) return;

  // Display user message in chat
  displayMessage(userMessage, "user");
  displayUserQuestion(userMessage);

  // Clear input field
  userInput.value = "";

  // Show loading indicator
  displayMessage("✨ Let me find the perfect recommendation for you...", "ai");

  // Send to AI and get response
  await sendMessageToAI(userMessage);
});

/* Initialize chat on page load */
window.addEventListener("DOMContentLoaded", initializeChat);
