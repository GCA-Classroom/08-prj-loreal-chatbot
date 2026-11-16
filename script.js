/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

// 👉 Paste your Cloudflare Worker URL here (no API key needed!)
const WORKER_URL = "https://loreal-chatbot.rcuellar138.workers.dev/";

// The system prompt tells the AI who it is and what it may talk about
const systemPrompt = `You are the L'Oréal Beauty Advisor, a friendly and knowledgeable assistant for L'Oréal.

You help users with:
- L'Oréal products across makeup, skincare, haircare, and fragrance
- Personalized beauty routines (morning, evening, hair care, etc.)
- Product recommendations based on skin type, hair type, concerns, budget, and preferences
- General beauty topics related to these areas (ingredients, application tips, etc.)

Rules:
- If a question is NOT about L'Oréal products, beauty routines, or beauty-related topics, politely refuse and steer the user back to beauty. Example: "I'm here to help with L'Oréal products and beauty routines. Is there something in makeup, skincare, haircare, or fragrance I can help with?"
- Ask a short follow-up question when you need more detail (skin type, hair type, concerns) to personalize advice.
- Never invent product names, prices, or claims. If you are unsure, say so and suggest checking loreal.com.
- Keep answers warm, clear, and concise.`;

// Keep the whole conversation so the AI remembers earlier messages
const messages = [{ role: "system", content: systemPrompt }];

/* Add a message bubble to the chat window */
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `msg ${sender}`; // "msg user" or "msg ai"
  div.textContent = text; // textContent is safe against HTML injection
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight; // scroll to newest message
  return div;
}

// Set initial message
addMessage(
  "👋 Hello! I'm your L'Oréal Beauty Advisor. Ask me about makeup, skincare, haircare, fragrance, or a personalized routine!",
  "ai"
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // Show the user's message and clear the input
  addMessage(text, "user");
  messages.push({ role: "user", content: text });
  userInput.value = "";

  // Show a temporary "thinking" message and disable the button
  const thinking = addMessage("Thinking…", "ai");
  sendBtn.disabled = true;

  try {
    // Send the conversation to the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });

    const data = await response.json();

    // Pull the reply text out of the OpenAI response
    const reply = data.choices[0].message.content;

    // Replace "Thinking…" with the real reply and save it to history
    thinking.textContent = reply;
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error(error);
    thinking.textContent =
      "Sorry, something went wrong. Please try again in a moment.";
    messages.pop(); // remove the failed user message from history
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});