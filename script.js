/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestionDiv = document.getElementById("latestQuestion");
const questionTextDiv = document.getElementById("questionText");

// Get worker URL from config
const WORKER_URL = CONFIG.WORKER_URL;

// Enhanced conversation tracking
let conversationHistory = [];
let userContext = {
  name: null,
  preferences: {
    skinType: null,
    hairType: null,
    favoriteProducts: [],
    concerns: [],
    previousRecommendations: [],
  },
  conversationSummary: {
    topicsDiscussed: [],
    questionsAsked: [],
    productsInterested: [],
    lastInteraction: null,
  },
};

/* Display latest question */
function displayLatestQuestion(question) {
  questionTextDiv.textContent = question;
  latestQuestionDiv.style.display = "block";

  // Add animation class
  latestQuestionDiv.classList.remove("slide-in");
  setTimeout(() => {
    latestQuestionDiv.classList.add("slide-in");
  }, 10);
}

/* Hide latest question */
function hideLatestQuestion() {
  latestQuestionDiv.style.display = "none";
  latestQuestionDiv.classList.remove("slide-in");
}

/* Extract user context from messages */
function extractUserContext(message) {
  const lowerMessage = message.toLowerCase();

  // Extract name if user introduces themselves
  const namePatterns = [
    /my name is ([a-zA-Z]+)/i,
    /i'm ([a-zA-Z]+)/i,
    /i am ([a-zA-Z]+)/i,
    /call me ([a-zA-Z]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1].length > 1) {
      userContext.name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      break;
    }
  }

  // Extract skin type
  const skinTypes = [
    "oily",
    "dry",
    "combination",
    "sensitive",
    "normal",
    "mature",
  ];
  for (const type of skinTypes) {
    if (lowerMessage.includes(type + " skin")) {
      userContext.preferences.skinType = type;
      break;
    }
  }

  // Extract hair type
  const hairTypes = [
    "curly",
    "straight",
    "wavy",
    "thick",
    "thin",
    "fine",
    "damaged",
    "colored",
  ];
  for (const type of hairTypes) {
    if (lowerMessage.includes(type + " hair")) {
      userContext.preferences.hairType = type;
      break;
    }
  }

  // Extract beauty concerns
  const concerns = [
    "acne",
    "wrinkles",
    "dark spots",
    "dullness",
    "dryness",
    "oiliness",
    "frizz",
    "volume",
    "shine",
    "coverage",
    "longevity",
    "hydration",
  ];
  for (const concern of concerns) {
    if (
      lowerMessage.includes(concern) &&
      !userContext.preferences.concerns.includes(concern)
    ) {
      userContext.preferences.concerns.push(concern);
    }
  }

  // Extract product interests
  const products = [
    "moisturizer",
    "serum",
    "cleanser",
    "foundation",
    "lipstick",
    "mascara",
    "shampoo",
    "conditioner",
    "concealer",
    "primer",
    "sunscreen",
    "toner",
  ];
  for (const product of products) {
    if (
      lowerMessage.includes(product) &&
      !userContext.conversationSummary.productsInterested.includes(product)
    ) {
      userContext.conversationSummary.productsInterested.push(product);
    }
  }

  // Track topics discussed
  const topics = [
    "skincare routine",
    "makeup application",
    "hair care",
    "anti-aging",
    "color matching",
    "product recommendations",
    "beauty tips",
  ];
  for (const topic of topics) {
    if (
      lowerMessage.includes(topic.replace(" ", "")) ||
      lowerMessage.includes(topic)
    ) {
      if (!userContext.conversationSummary.topicsDiscussed.includes(topic)) {
        userContext.conversationSummary.topicsDiscussed.push(topic);
      }
    }
  }

  // Store the question
  userContext.conversationSummary.questionsAsked.push({
    question: message,
    timestamp: new Date().toISOString(),
  });

  userContext.conversationSummary.lastInteraction = new Date().toISOString();
}

/* Generate context-aware system message */
function generateContextualSystemMessage() {
  let contextInfo = "";

  if (userContext.name) {
    contextInfo += `The user's name is ${userContext.name}. `;
  }

  if (userContext.preferences.skinType) {
    contextInfo += `They have ${userContext.preferences.skinType} skin. `;
  }

  if (userContext.preferences.hairType) {
    contextInfo += `They have ${userContext.preferences.hairType} hair. `;
  }

  if (userContext.preferences.concerns.length > 0) {
    contextInfo += `Their main beauty concerns are: ${userContext.preferences.concerns.join(
      ", "
    )}. `;
  }

  if (userContext.conversationSummary.topicsDiscussed.length > 0) {
    contextInfo += `Previously discussed topics: ${userContext.conversationSummary.topicsDiscussed.join(
      ", "
    )}. `;
  }

  if (userContext.conversationSummary.productsInterested.length > 0) {
    contextInfo += `Products they've shown interest in: ${userContext.conversationSummary.productsInterested.join(
      ", "
    )}. `;
  }

  if (userContext.preferences.previousRecommendations.length > 0) {
    contextInfo += `Previously recommended products: ${userContext.preferences.previousRecommendations.join(
      ", "
    )}. `;
  }

  return `You are a helpful and knowledgeable assistant specializing exclusively in L'Oréal. 

${contextInfo ? `CONTEXT ABOUT THIS USER: ${contextInfo}` : ""}

Remember to:
- Use their name when you know it
- Reference their previous questions and interests
- Build upon past conversations naturally
- Avoid repeating the same recommendations
- Be personal and engaging based on their history

Only answer questions related to:
- L'Oréal products (skincare, makeup, hair care)
- Skincare and haircare routines involving L'Oréal products
- L'Oréal product recommendations and usage guidance
- L'Oréal brand information and product lines
- How to use specific L'Oréal products effectively
- L'Oréal product comparisons and which products work best for specific needs

If a question is outside the L'Oréal domain, politely redirect them back to relevant L'Oréal topics.

When giving advice, always focus on specific L'Oréal products and mention product names when relevant (like Revitalift, Elvive, Colour Riche, True Match, Voluminous, etc.) as the system will automatically show product images.

Always be friendly, helpful, and knowledgeable about L'Oréal products specifically.`;
}

/* Track product recommendations made by AI */
function trackProductRecommendations(aiResponse) {
  const lowerResponse = aiResponse.toLowerCase();

  // Common L'Oréal product names to track
  const productNames = [
    "revitalift",
    "elvive",
    "colour riche",
    "true match",
    "voluminous",
    "infallible",
    "paris",
    "preference",
    "feria",
    "magic root cover up",
    "telescopic",
    "lash paradise",
    "rouge signature",
    "pure clay",
  ];

  for (const product of productNames) {
    if (
      lowerResponse.includes(product) &&
      !userContext.preferences.previousRecommendations.includes(product)
    ) {
      userContext.preferences.previousRecommendations.push(product);
    }
  }
}

/* Create a message element */
function createMessage(content, isUser = false, productImages = []) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "message-avatar";

  const iconSpan = document.createElement("span");
  iconSpan.className = "material-icons";
  iconSpan.setAttribute("aria-hidden", "true");
  iconSpan.textContent = isUser ? "person" : "spa";

  avatarDiv.appendChild(iconSpan);

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.innerHTML = `<p>${content}</p>`;

  // Add product images if provided
  if (productImages && productImages.length > 0) {
    const imagesContainer = document.createElement("div");
    imagesContainer.className = "product-images";

    productImages.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";

      productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy" />
        <div class="product-info">
          <h4 class="product-name">${product.name}</h4>
          <p class="product-price">${product.price}</p>
        </div>
      `;

      imagesContainer.appendChild(productCard);
    });

    contentDiv.appendChild(imagesContainer);
  }

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);

  return messageDiv;
}

/* Add message to chat window */
function addMessage(content, isUser = false, productImages = []) {
  const messageElement = createMessage(content, isUser, productImages);
  chatWindow.appendChild(messageElement);

  // Scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Add to conversation history
  conversationHistory.push({
    role: isUser ? "user" : "assistant",
    content: content,
  });
}

/* Show typing indicator */
function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot-message typing-indicator";
  typingDiv.id = "typing-indicator";

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "message-avatar";

  const iconSpan = document.createElement("span");
  iconSpan.className = "material-icons";
  iconSpan.setAttribute("aria-hidden", "true");
  iconSpan.textContent = "spa";

  avatarDiv.appendChild(iconSpan);

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.innerHTML =
    "<p>✨ Thinking of the perfect beauty advice for you... 💄</p>";

  typingDiv.appendChild(avatarDiv);
  typingDiv.appendChild(contentDiv);

  chatWindow.appendChild(typingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Remove typing indicator */
function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

/* Call Cloudflare Worker API */
async function callWorkerAPI(userMessage) {
  try {
    // Extract context from user message
    extractUserContext(userMessage);

    // Display latest question
    displayLatestQuestion(userMessage);

    // Add user message to conversation
    addMessage(userMessage, true);

    // Show typing indicator
    showTypingIndicator();

    // Generate contextual system message
    const contextualSystemMessage = generateContextualSystemMessage();

    // Prepare messages for the worker with context
    const messages = [
      {
        role: "system",
        content: contextualSystemMessage,
      },
      ...conversationHistory.slice(-CONFIG.MAX_CONVERSATION_HISTORY), // Keep last N messages for context
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Call the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    // Remove typing indicator
    removeTypingIndicator();

    if (!response.ok) {
      throw new Error(`Worker API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content;

      // Track product recommendations made by AI
      trackProductRecommendations(aiResponse);

      // Get product suggestions based on user message and AI response
      const productSuggestions = getProductSuggestions(userMessage, aiResponse);

      if (productSuggestions.length > 0) {
        // Add AI response with product suggestions
        addMessage(aiResponse, false, productSuggestions);
      } else {
        // Add AI response without products
        addMessage(aiResponse, false);
      }
    } else {
      throw new Error("Invalid response format from worker");
    }
  } catch (error) {
    // Remove typing indicator
    removeTypingIndicator();

    console.error("Error calling Cloudflare Worker:", error);

    let errorMessage = userContext.name
      ? `I'm having trouble connecting right now, ${userContext.name}. Please try again in a moment! 💖`
      : "I'm having trouble connecting right now. Please try again in a moment! 💖";

    if (error.message.includes("401")) {
      errorMessage =
        "There seems to be an authentication issue. Please check the worker configuration! 🔑";
    } else if (error.message.includes("429")) {
      errorMessage =
        "I'm getting lots of beauty questions right now! Please try again in a moment. ✨";
    } else if (error.message.includes("Worker API Error")) {
      errorMessage =
        "The beauty service is temporarily unavailable. Please try again soon! 💄";
    } else if (error.message.includes("fetch")) {
      errorMessage =
        "Please make sure to deploy your Cloudflare Worker and update the WORKER_URL in config.js! 🚀";
    }

    addMessage(errorMessage, false);
  }
}

/* Get L'Oréal product suggestions based on user query */
function getProductSuggestions(userMessage, aiResponse) {
  const products = [];
  const message = (userMessage + " " + aiResponse).toLowerCase();

  // Skincare products
  if (
    message.includes("moisturizer") ||
    message.includes("hydrat") ||
    message.includes("dry skin")
  ) {
    products.push({
      name: "L'Oréal Revitalift Anti-Wrinkle + Firming Moisturizer",
      price: "$12.99",
      image:
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop&crop=center",
    });
  }

  if (
    message.includes("serum") ||
    message.includes("vitamin c") ||
    message.includes("brighten")
  ) {
    products.push({
      name: "L'Oréal Revitalift Derm Intensives Vitamin C Serum",
      price: "$19.99",
      image:
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop&crop=center",
    });
  }

  if (
    message.includes("cleanser") ||
    message.includes("wash") ||
    message.includes("clean")
  ) {
    products.push({
      name: "L'Oréal Pure-Clay Detox & Brighten Cleanser",
      price: "$6.99",
      image:
        "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=200&h=200&fit=crop&crop=center",
    });
  }

  // Makeup products
  if (
    message.includes("lipstick") ||
    message.includes("lip") ||
    message.includes("rouge")
  ) {
    products.push({
      name: "L'Oréal Colour Riche Lipstick",
      price: "$8.99",
      image:
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200&h=200&fit=crop&crop=center",
    });
  }

  if (
    message.includes("foundation") ||
    message.includes("coverage") ||
    message.includes("base")
  ) {
    products.push({
      name: "L'Oréal True Match Foundation",
      price: "$10.99",
      image:
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop&crop=center",
    });
  }

  if (
    message.includes("mascara") ||
    message.includes("lash") ||
    message.includes("eye")
  ) {
    products.push({
      name: "L'Oréal Voluminous Lash Paradise Mascara",
      price: "$9.99",
      image:
        "https://images.unsplash.com/photo-1631214540149-8dcf3d1a2b8e?w=200&h=200&fit=crop&crop=center",
    });
  }

  // Hair care products
  if (message.includes("shampoo") || message.includes("hair wash")) {
    products.push({
      name: "L'Oréal Elvive Total Repair 5 Shampoo",
      price: "$4.99",
      image:
        "https://images.unsplash.com/photo-1571875257727-256c96c0c6b3?w=200&h=200&fit=crop&crop=center",
    });
  }

  if (message.includes("conditioner") || message.includes("hair treatment")) {
    products.push({
      name: "L'Oréal Elvive Total Repair 5 Conditioner",
      price: "$4.99",
      image:
        "https://images.unsplash.com/photo-1556228578-dd3a815da2b1?w=200&h=200&fit=crop&crop=center",
    });
  }

  if (
    message.includes("hair color") ||
    message.includes("dye") ||
    message.includes("color")
  ) {
    products.push({
      name: "L'Oréal Preference Hair Color",
      price: "$7.99",
      image:
        "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=200&h=200&fit=crop&crop=center",
    });
  }

  return products;
}

/* Handle form submission */
function handleSubmit(event) {
  event.preventDefault();

  const message = userInput.value.trim();
  if (message && message.length <= CONFIG.MAX_MESSAGE_LENGTH) {
    callWorkerAPI(message);
    userInput.value = "";
  }
}

/* Initialize the chatbot */
function initializeChatbot() {
  // Clear the static welcome message first
  chatWindow.innerHTML = "";

  // Add dynamic welcome message
  const welcomeMessage = userContext.name
    ? `Welcome back, ${userContext.name}! I'm here to help you discover the perfect L'Oréal products for your beauty needs. What would you like to know about today? 💄✨`
    : "Welcome! I'm your L'Oréal beauty assistant. I can help you find the perfect skincare, makeup, and hair care products from L'Oréal. What would you like to know about today? 💄✨";

  addMessage(welcomeMessage, false);

  // Add event listeners
  chatForm.addEventListener("submit", handleSubmit);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  });

  // Add input validation
  userInput.addEventListener("input", (e) => {
    if (e.target.value.length > CONFIG.MAX_MESSAGE_LENGTH) {
      e.target.value = e.target.value.substring(0, CONFIG.MAX_MESSAGE_LENGTH);
    }
  });
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initializeChatbot);
