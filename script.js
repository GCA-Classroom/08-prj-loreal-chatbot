/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Now using Cloudflare Worker endpoint for secure API calls
console.log("Using Cloudflare Worker endpoint for OpenAI API calls ✅");

// Function to call OpenAI API through Cloudflare Worker
async function callOpenAI(userMessage) {
  try {
    // Show loading message
    chatWindow.innerHTML += `<div class="msg user">You: ${userMessage}</div>`;
    chatWindow.innerHTML += `<div class="msg ai">AI: Thinking...</div>`;

    // First, check if the question is related to L'Oréal using Cloudflare Worker
    const validationResponse = await fetch(
      "https://fragrant-snowflake-0588.whatsupajay25.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a validator that determines if a question is related to L'Oréal, beauty products, skincare, makeup, hair care, cosmetics, or beauty routines. Respond with only 'YES' if the question is related to these topics, or 'NO' if it's not related.",
            },
            {
              role: "user",
              content: `Is this question related to L'Oréal, beauty products, skincare, makeup, hair care, cosmetics, or beauty routines? Question: "${userMessage}"`,
            },
          ],
          max_tokens: 10,
          temperature: 0.1,
        }),
      }
    );

    // Check if validation request was successful
    if (!validationResponse.ok) {
      throw new Error(
        `Validation request failed: ${validationResponse.status}`
      );
    }

    // Get the validation response
    const validationData = await validationResponse.json();
    const isLorealRelated = validationData.choices[0].message.content
      .trim()
      .toUpperCase();

    // If question is not related to L'Oréal, give a polite response
    if (isLorealRelated === "NO") {
      chatWindow.innerHTML = chatWindow.innerHTML.replace(
        "AI: Thinking...",
        "AI: I'm sorry, but I can only help with questions related to L'Oréal products, beauty, skincare, makeup, hair care, and cosmetics. Please ask me about L'Oréal products or beauty routines!"
      );
      return;
    }

    // If question is related to L'Oréal, proceed with the main API call through Cloudflare Worker
    const response = await fetch(
      "https://fragrant-snowflake-0588.whatsupajay25.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful L'Oréal product advisor. Help customers with beauty product recommendations and routines. Focus specifically on L'Oréal products and services.",
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      }
    );

    // Check if request was successful
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    // Get the response data
    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Update chat window with AI response
    chatWindow.innerHTML = chatWindow.innerHTML.replace(
      "AI: Thinking...",
      `AI: ${aiMessage}`
    );
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    chatWindow.innerHTML = chatWindow.innerHTML.replace(
      "AI: Thinking...",
      "AI: Sorry, I encountered an error. Please try again."
    );
  }
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input
  const message = userInput.value.trim();

  // Check if message is not empty
  if (message) {
    // Call OpenAI API with user message
    await callOpenAI(message);

    // Clear input field
    userInput.value = "";
  }
});
