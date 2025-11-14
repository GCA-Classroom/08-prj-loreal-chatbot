/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Conversation history to maintain context
const conversationHistory = [];

// System prompt - guides the chatbot to be L'Oréal focused
const systemPrompt = `You are a knowledgeable L'Oréal beauty advisor. Your role is to help customers with:
- L'Oréal product recommendations (skincare, haircare, makeup, fragrance)
- Beauty routines and skincare regimens
- Product ingredients and benefits
- How to use L'Oréal products effectively
- Matching products to skin types, hair types, and concerns

Only answer questions related to L'Oréal products and beauty advice. If asked about other brands or unrelated topics, politely redirect the conversation back to L'Oréal products and beauty. Keep responses helpful, friendly, and concise.

Use emojis when appropriate to make responses more engaging and friendly (e.g., ✨ for skincare, 💄 for makeup, 💇 for haircare, 🌟 for recommendations, 💧 for hydration, ☀️ for sun care).`;

// Set initial message
const welcomeMsg = document.createElement("div");
welcomeMsg.textContent =
  "👋 Hello! I'm your L'Oréal beauty advisor. Ask me about products, routines, or recommendations!";
welcomeMsg.style.padding = "20px";
welcomeMsg.style.marginBottom = "10px";
chatWindow.appendChild(welcomeMsg);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user's message
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Display user's message in chat
  displayMessage(userMessage, "user");

  // Clear input field
  userInput.value = "";

  // Add user message to conversation history
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  // Show loading indicator
  displayMessage("Thinking...", "ai", true);

  try {
    // Send request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`, // API_KEY comes from secrets.js
      },
      body: JSON.stringify({
        model: "gpt-4o", // Using gpt-4o model
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory, // Include conversation history for context
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    // Check if response is successful
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Parse the response
    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Add AI response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: aiMessage,
    });

    // Remove loading indicator and display AI response
    removeLoadingMessage();
    displayMessage(aiMessage, "ai");
  } catch (error) {
    // Handle errors
    removeLoadingMessage();
    displayMessage(`Sorry, there was an error: ${error.message}`, "ai");
    console.error("Error:", error);
  }
});

/* Display a message in the chat window */
function displayMessage(message, sender, isLoading = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `msg ${sender}`;

  if (isLoading) {
    messageDiv.id = "loading-message";
  }

  // Use data attribute for bubble content
  messageDiv.setAttribute("data-content", message);

  chatWindow.appendChild(messageDiv);

  // Scroll to bottom of chat
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Remove loading message */
function removeLoadingMessage() {
  const loadingMsg = document.getElementById("loading-message");
  if (loadingMsg) {
    loadingMsg.remove();
  }
}
