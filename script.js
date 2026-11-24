/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

const API_URL = "https://worker-bot.cda3-2005.workers.dev/";
let conversation = [];

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // When using Cloudflare, you'll need to POST a `messages` array in the body,
  // and handle the response using: data.choices[0].message.content
  const question = userInput.value.trim();

  // Prevent multiple submissions
  if (sendBtn.disabled) {
    return;
  }
  
  const systemPrompt = `You are a L'Oreal Smart Product Advisor, a friendly beauty and product expert.
  You will help customers with skincare, haircare, makeup, beauty routines, product ingredients, product recommendations, and general beauty questions.

  Rules:
  1. Only answer questions relate to L'Oreal products, routines, and recommendations
  2. If the visitor asks about an unrelated topic or goes in an unrelated direction, politely steer them back to L'Oreal products, routines, and recommendations.
  3. Sound kind, warm, and family-friendly
  4. Keep answers to a 200 word maximum.
  5. If you are not sure about something, say so instead of guessing`;

  // Save message to conversation
  conversation.push({role: "user", content: question});

  // Clear input
  userInput.value = "";

  // Show loading message
  chatWindow.innerText = "Thinking..."

  // Disable button
  sendBtn.disabled = true;

  try {
    /* SEND REQUEST TO CLOUDFLARE */
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversation
      })
    });

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status}`
      );
    }

    // Read the full OpenAI response from Cloudflare
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      throw new Error(
        data.error?.message ||
        data.error ||
        `Request failed: ${response.status}`
      );
    }

    // Extract the AI-generated response
    const reply = data.choices?.[0]?.message?.content;

    if (!reply || typeof reply !== "string") {
      console.error("Unexpected response format:", data);
      throw new Error("Invalid response from AI.");
    }

    conversation.push({role: "assistant", content: reply});
    chatWindow.innerText = reply;
  } catch (error) {
    console.error("Chat error:", error);
    conversation.pop();
    chatWindow.innerText = "Sorry, We're having trouble producing a response at the moment!"
  } finally {
    // Enable button again
    sendBtn.disabled = false;
    userInput.focus();
  }
});