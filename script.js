/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Store the conversation history as an array of message objects
let conversationHistory = [
  {
    role: "system",
    content:
      "Prompt ID: pmpt_6886953497c08196b110977be1ac621603a5f42ca03f173c. You are a friendly assistant for L'Oréal. Only answer questions related to L’Oréal products, routines, and recommendations. Do not answer other questions. If the user asks something unrelated, politely redirect them to L'Oréal topics. Always be nice and, when possible, show a step-by-step process for routines or recommendations.",
  },
];

// Set initial message in the chat window
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Wait for the DOM to load before running code
document.addEventListener("DOMContentLoaded", () => {
  // Listen for form submission (user presses enter or clicks send)
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Capture user input from the chat interface
    const message = userInput.value.trim();
    if (!message) return;

    // Clear previous user question display (if any)
    const prevQuestion = document.getElementById("latest-question");
    if (prevQuestion) {
      chatWindow.removeChild(prevQuestion);
    }

    // Display user's latest question above the AI response
    const questionDiv = document.createElement("div");
    questionDiv.id = "latest-question";
    questionDiv.className = "latest-question";
    questionDiv.textContent = `You asked: ${message}`;
    chatWindow.appendChild(questionDiv);

    // Display user's message bubble in the chat interface (history)
    appendMessageBubble("user", message);

    // Add user's message to conversation history
    conversationHistory.push({ role: "user", content: message });

    // Clear the input field
    userInput.value = "";

    // Show a loading message bubble while waiting for AI response
    appendMessageBubble("ai", "Thinking...");

    // Send request to OpenAI's Chat Completions API
    try {
      const aiReply = await sendMessageToOpenAI();

      // Remove the "Thinking..." message bubble
      removeLastMessageBubble("ai");

      // Display chatbot response bubble clearly in the chat interface
      appendMessageBubble("ai", aiReply);

      // Add AI's reply to conversation history
      conversationHistory.push({ role: "assistant", content: aiReply });
    } catch (error) {
      removeLastMessageBubble("ai");
      appendMessageBubble(
        "ai",
        "Sorry, there was a problem connecting to the AI."
      );
      console.error(error);
    }
  });

  // Function to add a message bubble to the chat window
  function appendMessageBubble(role, text) {
    // Replace **word** with <b>word</b> for bold styling
    let htmlText = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

    // Dynamic emoji selection for AI responses
    if (role === "ai") {
      // Pick emoji based on detected sentiment or topic in the AI response
      let emoji = "✨";
      if (/thank|thanks|appreciate/i.test(text)) {
        emoji = "🙏";
      } else if (/happy|joy|smile|great|wonderful|awesome|love/i.test(text)) {
        emoji = "😊";
      } else if (/step|routine|process|guide|instructions|how to/i.test(text)) {
        emoji = "📝";
      } else if (/product|recommend|suggest|try|choose|pick/i.test(text)) {
        emoji = "💄";
      } else if (/skin|face|care|moisturizer|serum|cleanser|mask/i.test(text)) {
        emoji = "🧴";
      } else if (/bye|goodbye|see you|later|farewell/i.test(text)) {
        emoji = "👋";
      } else if (/question|ask|help|assist/i.test(text)) {
        emoji = "❓";
      } else if (/congrats|congratulations|well done|success/i.test(text)) {
        emoji = "🎉";
      } else if (/error|problem|issue|sorry/i.test(text)) {
        emoji = "⚠️";
      } else if (/star|shine|bright|sparkle/i.test(text)) {
        emoji = "🌟";
      }

      // Add the chosen emoji at the start if not present
      if (!htmlText.startsWith(emoji)) {
        htmlText = `${emoji} ${htmlText}`;
      }
      // Add a sparkle emoji to the end of sentences for extra flair
      htmlText = htmlText.replace(/([.!?])(\s|$)/g, " ✨$1$2");
    }

    const msgDiv = document.createElement("div");
    msgDiv.className = `msg-bubble ${role}`;
    msgDiv.innerHTML = htmlText;

    // Add interactivity: show timestamp on hover
    msgDiv.title = `Sent at ${new Date().toLocaleTimeString()}`;

    // Optional: click to copy message text
    msgDiv.addEventListener("click", () => {
      navigator.clipboard.writeText(msgDiv.textContent);
      msgDiv.style.background = "#ffe066";
      setTimeout(() => {
        msgDiv.style.background = "";
      }, 400);
    });

    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
  }

  // Function to remove the last AI message bubble (used for "Thinking...")
  function removeLastMessageBubble(role) {
    const messages = chatWindow.getElementsByClassName(`msg-bubble ${role}`);
    if (messages.length > 0) {
      chatWindow.removeChild(messages[messages.length - 1]);
    }
  }
});

// This function sends the conversation history to your Cloudflare Worker and returns the AI's reply
async function sendMessageToOpenAI() {
  // Build the request body for your Cloudflare Worker
  const body = {
    model: "gpt-4o",
    messages: conversationHistory, // Send the full conversation history
  };

  // Send request to your deployed Cloudflare Worker endpoint
  try {
    const response = await fetch("https://old-river-ea40.aow39.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Check if the response is OK (status 200)
    if (!response.ok) {
      return `Sorry, there was a problem connecting to the AI (network error: ${response.status})`;
    }

    // Parse the response as JSON
    const data = await response.json();

    // Log the full response for debugging (students: check your browser console)
    console.log("OpenAI response:", data);

    // Check for a valid response from OpenAI
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      return data.choices[0].message.content;
    } else if (data.error && data.error.message) {
      return `Error: ${data.error.message}`;
    } else {
      return "Sorry, there was a problem connecting to the AI (invalid response).";
    }
  } catch (error) {
    console.error("Fetch exception:", error);
    return "Sorry, there was a problem connecting to the AI (exception).";
  }
}

// Reference ID: 61fbc222-9fe5-41ce-a3f6-3aaa922ee554
// Reference ID: 61fbc222-9fe5-41ce-a3f6-3aaa922ee554
