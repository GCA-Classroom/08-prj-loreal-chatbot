/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");

// The URL of your Cloudflare Worker (replace with the URL from the README / your deployment).
// No API key is needed here: the Worker keeps the OpenAI key secret.
const WORKER_URL = "https://lorial-worker.mamadoucth.workers.dev/";

// The messages array holds the whole conversation.
// The first message is the "system prompt" that tells the AI how to behave.
// Keeping every message here is what gives the chatbot memory (conversation history).
const messages = [
  {
    role: "system",
    content: `You are the L'Oréal Smart Product Advisor. You only answer questions about
L'Oréal products (makeup, skincare, haircare, fragrance), beauty routines, and
personalized recommendations. Be friendly, clear, and concise. If the user asks
about anything unrelated to L'Oréal or beauty, politely say you can only help with
L'Oréal products and beauty routines, and invite them to ask a beauty question.
Remember details the user shares (like their name or skin type) and use them.`,
  },
];

// Helper function: adds a chat bubble to the chat window.
// "role" is either "user" or "ai", which controls the bubble's style.
function addMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `msg ${role}`;
  bubble.textContent = text; // textContent is safe (it won't run any HTML)
  chatWindow.appendChild(bubble);

  // Scroll to the newest message
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

// Show a starting message
addMessage("ai", "👋 Hello! How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get what the user typed
  const text = userInput.value.trim();
  if (text === "") return;

  // Show the user's bubble and the "latest question" line above the chat
  addMessage("user", text);
  latestQuestion.textContent = `You asked: ${text}`;

  // Save the user's message to the history, then clear the input box
  messages.push({ role: "user", content: text });
  userInput.value = "";

  // Show a temporary "thinking" bubble while we wait for the reply
  const thinkingBubble = addMessage("ai", "Thinking…");

  try {
    // Send the whole conversation to the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });

    // Turn the response into a JavaScript object
    const data = await response.json();
    console.log(data);

    // The assistant's reply is here
    const reply = data.choices[0].message.content;

    // Replace "Thinking…" with the real reply, and save it to the history
    thinkingBubble.textContent = reply;
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    // If something goes wrong, tell the user and log the error for debugging
    console.error("Error:", error);
    thinkingBubble.textContent =
      "Sorry, something went wrong. Please try again.";
  }

  // Keep the view scrolled to the bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
});