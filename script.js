// The class-hosted proxy keeps the API key out of the browser.
const workerUrl = "https://l-oreal-chatbot.yortizro.workers.dev/";
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const messageList = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");
const languageSelect = document.getElementById("language");
const suggestions = document.querySelectorAll(".suggestion");

const systemMessage = {
  role: "system",
  content:
    "You are a friendly L'Oréal beauty advisor. Help users discover L'Oréal Group products in skincare, makeup, haircare, and fragrance, and build personalized routines. Useful examples include L'Oréal Paris RevitaLift skincare, True Match and Infallible makeup, and Elvive and EverPure haircare. For fragrance, Lancôme La Vie Est Belle and Yves Saint Laurent Libre are L'Oréal Group brand products; identify their brands accurately and do not call them L'Oréal Paris products. Treat examples as starting points, not guaranteed recommendations. Ask about skin or hair type, concerns, preferences, and budget when helpful. Product names and availability vary by country, so ask the user's country when availability matters and never invent product details. Give general beauty advice, not medical diagnoses, and suggest consulting a healthcare professional for serious or persistent concerns. Only answer questions about L'Oréal Group products, beauty routines, and related advice; politely decline anything else.",
};
let messages = [systemMessage];
let isWaiting = false;

// Update the interface and suggested questions when the language changes.
function updateLanguage() {
  const text = translations[languageSelect.value];
  document.documentElement.lang = languageSelect.value;
  document.title = text.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = text[element.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", text[element.dataset.i18nAria]);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.title = text[element.dataset.i18nTitle];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = text[element.dataset.i18nPlaceholder];
  });
  document.querySelectorAll("[data-i18n-prompt]").forEach((element) => {
    element.dataset.prompt = text[element.dataset.i18nPrompt];
  });
  document.querySelectorAll("[data-message-label]").forEach((element) => {
    element.textContent = text[element.dataset.messageLabel];
  });
}

// Use textContent so messages are displayed as text, not as HTML.
function addMessage(role, text, isError = false) {
  const message = document.createElement("div");
  message.className = `message ${role}${isError ? " error" : ""}`;

  const label = document.createElement("span");
  label.className = "message-label";
  label.dataset.messageLabel = role === "user" ? "you" : "advisor";
  label.textContent = translations[languageSelect.value][label.dataset.messageLabel];

  const body = document.createElement("p");
  body.className = "message-body";
  body.lang = languageSelect.value;
  body.textContent = text;

  message.append(label, body);
  messageList.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

// Send one message at a time so the conversation stays in order.
async function sendMessage(text) {
  const message = text.trim();
  if (!message || isWaiting) return;

  const languageText = translations[languageSelect.value];
  isWaiting = true;
  sendBtn.disabled = true;
  resetBtn.disabled = true;
  languageSelect.disabled = true;
  userInput.disabled = true;
  suggestions.forEach((suggestion) => { suggestion.disabled = true; });
  welcome.hidden = true;
  addMessage("user", message);
  messages.push({ role: "user", content: message });
  userInput.value = "";
  const thinking = addMessage("assistant", languageText.thinking);

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: `${systemMessage.content} Respond in ${languageText.replyLanguage}, even if earlier messages use another language.` },
          ...messages.slice(1),
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      const errorMessage = typeof data.error === "string"
        ? data.error
        : data.error?.message;
      throw new Error(errorMessage || languageText.requestFailed);
    }

    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error(languageText.emptyResponse);
    }

    thinking.remove();
    messages.push({ role: "assistant", content: reply });
    addMessage("assistant", reply);
  } catch (error) {
    // Remove the failed turn from the history and let the user retry it.
    messages.pop();
    thinking.remove();
    const errorDetail = error instanceof TypeError
      ? languageText.connectionFailed
      : error.message;
    addMessage("assistant", `${languageText.failed} (${errorDetail})`, true);
    userInput.value = message;
  } finally {
    isWaiting = false;
    sendBtn.disabled = false;
    resetBtn.disabled = false;
    languageSelect.disabled = false;
    userInput.disabled = false;
    suggestions.forEach((suggestion) => { suggestion.disabled = false; });
    userInput.focus();
  }
}

languageSelect.addEventListener("change", updateLanguage);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(userInput.value);
});

suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    sendMessage(suggestion.dataset.prompt);
  });
});

resetBtn.addEventListener("click", () => {
  messages = [systemMessage];
  messageList.replaceChildren();
  welcome.hidden = false;
  userInput.value = "";
  userInput.focus();
});

updateLanguage();
