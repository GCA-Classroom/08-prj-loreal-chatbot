console.log("Chatbot script loaded successfully.");
/* Select DOM elements for chat interface */
const chatForm = document.getElementById("chat-form"); // The form where users type messages
const chatInput = document.getElementById("chat-input"); // The input box for user messages
const chatBox = document.getElementById("chat-box"); // The area where messages are shown

/* System prompt to guide the AI's behavior */
const systemPrompt = `
You are a helpful assistant for L’Oréal. Only answer questions related to L’Oréal products, beauty routines, skincare, haircare, makeup, and beauty recommendations. 
If a question is not about L’Oréal or beauty, politely respond: “Sorry, I can only help with L’Oréal products, routines, and beauty-related topics.”
`;

/* Function to add a message to the chat box */
function addMessage(sender, text) {
  // Create a container for each message with a gap
  const messageContainer = document.createElement("div");
  messageContainer.style.margin = "12px 0"; // Adds a gap between messages

  // Create the message bubble
  const messageDiv = document.createElement("div");
  messageDiv.className = sender; // "user" or "bot"
  messageDiv.style.padding = "10px";
  messageDiv.style.borderRadius = "8px";
  messageDiv.style.maxWidth = "70%";
  messageDiv.style.wordBreak = "break-word";
  messageDiv.style.marginLeft = sender === "user" ? "auto" : "0";
  messageDiv.style.marginRight = sender === "bot" ? "auto" : "0";
  messageDiv.style.background = sender === "user" ? "#e3f2fd" : "#f1f8e9";
  messageDiv.style.color = "#222";

  // Add a label for clarity
  const label = document.createElement("strong");
  if (sender === "user") {
    label.textContent = "You: ";
  } else {
    label.textContent = "L’Oréal BeautyBot: ";
  }
  messageDiv.appendChild(label);

  // Add the message text
  const span = document.createElement("span");
  span.textContent = text;
  messageDiv.appendChild(span);

  // Add the message bubble to the container
  messageContainer.appendChild(messageDiv);

  // Add the container to the chat box
  chatBox.appendChild(messageContainer);
  chatBox.scrollTop = chatBox.scrollHeight; // Always scroll to the newest message
}

/* Function to send user input to OpenAI API and get a response */
async function getChatbotResponse(userMessage) {
  addMessage("user", userMessage);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  addMessage("bot", "Thinking...");

  try {
    console.log(messages);
    const response = await fetch("https://project8.381raheem.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    const data = await response.json();
    console.log("Response from worker:", data);

    chatBox.removeChild(chatBox.lastChild);

    if (
      data &&
      data.reply // assuming your worker returns { reply: "..." }
    ) {
      addMessage("bot", data.reply.trim());
    } else if (data.error) {
      addMessage(
        "bot",
        `Error: ${data.error.message || JSON.stringify(data.error)}`
      );
    } else {
      addMessage("bot", "Sorry, I couldn't understand that.");
    }
  } catch (error) {
    chatBox.removeChild(chatBox.lastChild);
    addMessage(
      "bot",
      `Sorry, there was an error. Please try again. Error details: ${error}`
    );
  }
}

/* Listen for form submission (user sends a message) */
chatForm.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent page reload
  const userMessage = chatInput.value.trim();
  if (userMessage) {
    getChatbotResponse(userMessage);
    chatInput.value = ""; // Clear input
  }
});
