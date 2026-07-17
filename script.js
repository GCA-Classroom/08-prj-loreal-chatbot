/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Replace this with your deployed Cloudflare Worker URL.
const API_URL = "https://misty-feather-7f6c.melinda-nguyen-school.workers.dev/";

// System prompt that keeps the chatbot focused on L'Oréal-related questions.
const SYSTEM_PROMPT =
  "You are a L'Oréal beauty assistant. Only answer questions about L'Oréal products, skincare, makeup, haircare, fragrances, routines, and recommendations. If the user asks about anything else, politely say you can only help with L'Oréal beauty topics and invite them to ask about products or routines.";

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Add one new message to the chat window.
function addMessage(text, className) {
  const message = document.createElement("div");
  message.className = `msg ${className}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const messageText = userInput.value.trim();

  if (!messageText) {
    return;
  }

  // Show the user's message in the chat window.
  addMessage(messageText, "user");
  userInput.value = "";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: messageText,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error || !data.choices?.[0]?.message?.content) {
      const errorMessage =
        data.error?.code === "invalid_api_key"
          ? "The Cloudflare Worker key is invalid. Update OPENAI_API_KEY in Cloudflare Worker Secrets, then redeploy the worker."
          : data.error?.message ||
            "The assistant could not generate a reply. Please check your Cloudflare Worker setup.";
      addMessage(errorMessage, "ai");
      return;
    }

    const reply = data.choices[0].message.content;

    // Show the assistant's reply.
    addMessage(reply, "ai");
  } catch (error) {
    addMessage("Sorry, something went wrong. Please try again.", "ai");
    console.error(error);
  }
});
