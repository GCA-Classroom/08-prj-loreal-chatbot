/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

const productImages = [
  "img/2025-loreal-consumer-products-division-brand-anti-fall-scalp-serum-orange-bottle.png",
  "img/2025-loreal-consumer-products-division-brand-revitalift-age-correcting-serum-red-bottle.png",
  "img/KAS hero.png",
  "img/mixed-2024-10-tecni-art-flex-range.jpg"
];

const randomIndex = Math.floor(Math.random() * productImages.length);

// Choose a different full-page background image each time the page loads.
document.body.style.backgroundImage =
  `linear-gradient(rgb(255 255 255 / 55%), rgb(255 255 255 / 55%)), url("${productImages[randomIndex]}")`;
// Replace this with your Cloudflare Worker URL.
// The Worker keeps the API key secret and your browser never sees it.
const workerUrl = "https://polished-meadow-4033.vinhtang21.workers.dev/";

// Keep a short conversation history so the chatbot can reply in context.
const chatHistory = [];
let loadingMessage = null;

/* Add a message to the chat window */
function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = `msg ${role}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Show or hide a loading message while waiting for the response */
function setLoadingState(isLoading) {
  if (isLoading) {
    loadingMessage = document.createElement("div");
    loadingMessage.className = "msg ai";
    loadingMessage.textContent = "Thinking...";
    chatWindow.appendChild(loadingMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  if (loadingMessage) {
    loadingMessage.remove();
    loadingMessage = null;
  }
}

// Show the first greeting when the page loads.
addMessage("ai", "👋 Hello! How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();

  if (!userMessage) {
    return;
  }

  // Add the user's message to the chat.
  addMessage("user", userMessage);
  chatHistory.push({ role: "user", content: userMessage });

  // Clear the input and disable the button while we wait for the AI.
  userInput.value = "";
  userInput.disabled = true;
  sendBtn.disabled = true;
  setLoadingState(true);

  try {
    // Send the message to the Cloudflare worker. The worker will send it
    // to OpenAI using its stored API key.
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.error?.message || data.error || "The assistant could not respond.";
      throw new Error(errorMessage);
    }

    // OpenAI returns the reply inside the message content field.
    const aiReply = data.choices?.[0]?.message?.content;

    if (typeof aiReply !== "string" || !aiReply.trim()) {
      throw new Error("The assistant returned an empty response.");
    }

    // Save the AI response and show it in the chat.
    chatHistory.push({ role: "assistant", content: aiReply });
    addMessage("ai", aiReply);
  } catch (error) {
    console.error(error);
    addMessage(
      "ai",
      "Sorry, I couldn't answer that right now. Please try again."
    );
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    setLoadingState(false);
    userInput.focus();
  }
});
