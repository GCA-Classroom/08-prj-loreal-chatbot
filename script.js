/* Get references to the chat form, input box, and chat window */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Show a welcome message when the page loads
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* System prompt to guide the chatbot's behavior */
const systemPrompt =
  "You are a helpful assistant for L’Oréal. Only answer questions related to L’Oréal products, skincare and haircare routines, and product recommendations. If asked about anything else, politely say you can only answer L’Oréal-related questions.";

/* Listen for the form submit event */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // Stop the page from reloading

  // Get the user's message from the input box
  const userMessage = userInput.value.trim();
  if (!userMessage) return; // Do nothing if the input is empty

  // Show the user's message and a "Thinking..." message
  chatWindow.innerHTML = `<b>You:</b> ${userMessage}<br><i>Thinking...</i>`;

  // Create the messages array for the OpenAI API
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  try {
    // Send a POST request to your backend that calls OpenAI's API
    const response = await fetch(
      "https://rough-cherry-5a3f.meberso.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o", // Use the gpt-4o model
          messages: messages, // Pass the messages array
        }),
      }
    );

    // Parse the JSON response
    const data = await response.json();

    // Get the chatbot's reply from the response
    const reply =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content
        : "Sorry, I couldn't get a response. Please try again.";

    // Show both the user's message and the chatbot's reply
    chatWindow.innerHTML = `<b>You:</b> ${userMessage}<br><b>L’Oréal Assistant:</b> ${reply}`;
  } catch (error) {
    // Show an error message if something goes wrong
    chatWindow.innerHTML =
      "Sorry, there was an error connecting to the assistant.";
  }

  // Clear the input box for the next message
  userInput.value = "";
});
