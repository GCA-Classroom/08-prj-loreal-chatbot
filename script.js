const DEFAULT_API_URL = window.BEAUTY_ADVISOR_WORKER_URL || "http://localhost:8787/api/chat";
const STORAGE_KEY = "loreal-chat-history";
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1800;

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const clearChatBtn = document.getElementById("clearChatBtn");
const sendBtn = document.getElementById("sendBtn");
const suggestionButtons = document.querySelectorAll(".suggestion-btn");

const state = {
  isSending: false,
  storageUnavailable: false,
  messages: readStoredMessages()
};

function readStoredMessages() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    const messages = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(messages)) {
      return [];
    }

    return messages
      .filter((message) =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= MAX_MESSAGE_CHARS
      )
      .map((message) => ({
        ...message,
        ...(message.status === "sending" ? { status: "failed" } : {})
      }))
      .slice(-MAX_HISTORY_MESSAGES);
  } catch {
    return [];
  }
}

function saveStoredMessages() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages));
    state.storageUnavailable = false;
  } catch {
    state.storageUnavailable = true;
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function buildMessageMarkup(message) {
  const { role } = message;
  const wrapper = document.createElement("div");
  wrapper.className = `message-row ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "assistant" ? "L" : "Y";

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = role === "assistant" ? "L'Oréal AI" : "You";

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  messageContent.textContent = message.content;

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = formatTime(message.timestamp);

  bubble.append(meta, messageContent, time);

  if (role === "user" && message.status === "failed") {
    const failure = document.createElement("p");
    failure.className = "message-error";
    failure.textContent = "Could not get a reply.";

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "retry-btn";
    retryButton.textContent = "Retry";
    retryButton.addEventListener("click", () => retryMessage(message));

    bubble.append(failure, retryButton);
  }

  wrapper.append(avatar, bubble);
  return wrapper;
}

function renderTypingIndicator() {
  const typing = document.createElement("div");
  typing.className = "message-row assistant typing";
  typing.innerHTML = `
    <div class="avatar">L</div>
    <div class="bubble assistant">
      <div class="typing-dots" role="status" aria-label="Assistant is typing">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chatWindow.appendChild(typing);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const typing = chatWindow.querySelector(".typing");
  if (typing) {
    typing.remove();
  }
}

function renderEmptyState() {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.innerHTML = `
    <div class="empty-badge">Beauty concierge</div>
    <p>Ask about your skin type, hair goals, or makeup preferences.</p>
  `;
  chatWindow.appendChild(emptyState);
}

function renderConversation() {
  chatWindow.innerHTML = "";

  if (state.messages.length === 0) {
    renderEmptyState();
    return;
  }

  state.messages.forEach((message) => {
    const node = buildMessageMarkup(message);
    chatWindow.appendChild(node);
  });

  if (state.storageUnavailable) {
    const notice = document.createElement("p");
    notice.className = "storage-warning";
    notice.setAttribute("role", "status");
    notice.textContent = "Chat memory is unavailable in this browser session.";
    chatWindow.appendChild(notice);
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setSendingState(isSending) {
  state.isSending = isSending;
  sendBtn.disabled = isSending;
  userInput.disabled = isSending;
  clearChatBtn.disabled = isSending;
  suggestionButtons.forEach((button) => {
    button.disabled = isSending;
  });
  sendBtn.textContent = isSending ? "Sending…" : "Send";
}

function appendUserMessage(text) {
  const message = {
    role: "user",
    content: text,
    timestamp: new Date().toISOString()
  };

  state.messages.push(message);
  state.messages = state.messages.slice(-MAX_HISTORY_MESSAGES);
  saveStoredMessages();
  renderConversation();
  return message;
}

function appendAssistantMessage(text) {
  const message = {
    role: "assistant",
    content: text,
    timestamp: new Date().toISOString()
  };

  state.messages.push(message);
  state.messages = state.messages.slice(-MAX_HISTORY_MESSAGES);
  saveStoredMessages();
  renderConversation();
}

async function requestAssistantResponse(userMessage) {
  setSendingState(true);
  renderTypingIndicator();

  const apiUrl = localStorage.getItem("loreal-chat-api-url") || DEFAULT_API_URL;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: state.messages.map(({ role, content }) => ({ role, content }))
      })
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("The beauty advisor returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data.error || "The beauty advisor is unavailable right now.");
    }

    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("The beauty advisor returned an invalid response.");
    }

    userMessage.status = "sent";
    removeTypingIndicator();
    appendAssistantMessage(data.reply.trim());
  } catch {
    removeTypingIndicator();
    userMessage.status = "failed";
    saveStoredMessages();
    renderConversation();
  } finally {
    setSendingState(false);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

async function retryMessage(message) {
  if (state.isSending || message.status !== "failed") {
    return;
  }

  message.status = "sending";
  saveStoredMessages();
  renderConversation();
  await requestAssistantResponse(message);
}

async function sendMessage(messageText) {
  const text = messageText.trim();

  if (!text || text.length > MAX_MESSAGE_CHARS || state.isSending) {
    return;
  }

  userInput.value = "";
  const message = appendUserMessage(text);
  await requestAssistantResponse(message);
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(userInput.value);
});

userInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(userInput.value);
  }
});

clearChatBtn.addEventListener("click", () => {
  if (state.isSending) {
    return;
  }

  if (!confirm("Clear the current chat?")) {
    return;
  }

  state.messages = [];
  saveStoredMessages();
  renderConversation();
  userInput.focus();
});

suggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const chosenMessage = button.dataset.message || "";
    if (chosenMessage) {
      userInput.value = chosenMessage;
      sendMessage(chosenMessage);
    }
  });
});

renderConversation();
userInput.focus();
