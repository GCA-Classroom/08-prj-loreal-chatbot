/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Track conversation history and user info
let conversationHistory = [];
let userName = "";

// System prompt for the assistant
const systemPrompt = `You are a playful and friendly L'Oréal Product Advisor with expertise in beauty, skincare, haircare, and wellness products. Your role is to:
- Provide knowledgeable recommendations about L'Oréal products and beauty routines
- Answer questions about skincare, haircare, makeup, and cosmetics
- Suggest products based on customer needs, skin type, and concerns
- Provide beauty tips and professional advice
- Use relevant emojis throughout your responses to make them fun and engaging (✨ for sparkle, 💄 for makeup, 💇 for hair, 🧴 for skincare, etc.)

TONE: Be warm, enthusiastic, and playful while remaining professional. Use emojis to add personality and make beauty advice feel fun!

IMPORTANT RESTRICTIONS:
- ONLY discuss L'Oréal products and general beauty/cosmetics advice
- If asked about non-L'Oréal products, politely decline and redirect to L'Oréal alternatives
- Do NOT provide medical advice - if health concerns are mentioned, recommend consulting a dermatologist
- Do NOT discuss topics unrelated to beauty, skincare, haircare, or wellness
- When asked off-topic questions, politely redirect the conversation back to L'Oréal products and beauty advice`;

// Ask for user's name on load
function promptForName() {
  const name = prompt("Welcome! What's your name?", "");
  if (name && name.trim()) {
    userName = name.trim();
  } else {
    userName = "Friend";
  }
}

// Set initial message
promptForName();

const initialMessage = document.createElement("div");
initialMessage.className = "msg ai";
initialMessage.innerHTML = `✨ Hello, <strong>${userName}</strong>! Welcome to your L'Oréal beauty guide! 💄 Ask me anything about skincare, haircare, makeup, or finding your perfect look. Let's glow together! 🌟`;
chatWindow.appendChild(initialMessage);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user message
  const message = userInput.value.trim();

  if (!message) return;

  // Display user message in chat
  const userMessageDiv = document.createElement("div");
  userMessageDiv.className = "msg user";
  userMessageDiv.textContent = message;
  chatWindow.appendChild(userMessageDiv);

  // Add user message to conversation history
  conversationHistory.push({
    role: "user",
    content: message,
  });

  // Clear input
  userInput.value = "";

  // Show loading state
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "msg ai loading";
  loadingDiv.textContent = "Thinking...";
  chatWindow.appendChild(loadingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Build messages array with system prompt and conversation history
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory,
    ];

    console.log("Sending request to Cloudflare Worker...");

    // Call Cloudflare Worker endpoint which handles OpenAI API securely
    const response = await fetch(
      "https://lorealsmartproductadvisor.vshreeni.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages,
        }),
      },
    );

    console.log("Response received:", response.status, response.statusText);

    // Parse response
    const data = await response.json();

    // Log the response for debugging
    console.log("API Response:", data);

    // Check for API errors (both from HTTP status and from OpenAI error message)
    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          `API request failed with status ${response.status}`,
      );
    }

    // Check if response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected response structure:", data);
      throw new Error(
        data.error?.message || "Unexpected response format from API",
      );
    }

    // Get ChatGPT's response
    const aiMessage = data.choices[0].message.content;

    // Add AI response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: aiMessage,
    });

    // Remove loading message and add real response
    loadingDiv.classList.remove("loading");
    loadingDiv.textContent = aiMessage;

    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error("Fetch Error Details:", error);
    loadingDiv.classList.remove("loading");

    // More specific error messages
    if (error.message.includes("Failed to fetch")) {
      loadingDiv.textContent =
        "Connection failed. Check if the Cloudflare Worker URL is correct or if there's a CORS issue.";
    } else {
      loadingDiv.textContent = `Sorry, something went wrong: ${error.message}`;
    }
  }
});
