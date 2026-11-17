/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const workerUrl = "https://l-oreal-chatbot.yortizro.workers.dev/";
const messages = [
  {
    role: "system",
    content:
      "You are a helpful L'Oréal beauty product assistant. Give friendly, clear recommendations about makeup, skincare, haircare, and fragrance.",
  },
];

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  const userMessage = document.createElement("p");
  userMessage.className = "msg user";
  userMessage.textContent = `You: ${message}`;
  chatWindow.appendChild(userMessage);

  messages.push({ role: "user", content: message });
  userInput.value = "";

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "The chatbot request failed.");
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error("The chatbot returned an empty response.");
    }

    messages.push({ role: "assistant", content: reply });

    const assistantMessage = document.createElement("p");
    assistantMessage.className = "msg ai";
    assistantMessage.textContent = `Assistant: ${reply}`;
    chatWindow.appendChild(assistantMessage);
  } catch (error) {
    messages.pop();

    const errorMessage = document.createElement("p");
    errorMessage.className = "msg ai";
    errorMessage.textContent = `Sorry, I couldn't get a reply: ${error.message}`;
    chatWindow.appendChild(errorMessage);
  }
});
