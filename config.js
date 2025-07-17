// Configuration for L'Oréal Chatbot

// ⚠️ IMPORTANT: Update this URL after deploying your Cloudflare Worker
// Replace 'your-worker-name' and 'your-subdomain' with your actual worker details
const CONFIG = {
  WORKER_URL: "https://your-worker-name.your-subdomain.workers.dev",

  // For development/testing - you can temporarily use direct API calls
  // by setting USE_WORKER to false and including secrets.js
  USE_WORKER: true,

  // Chat configuration
  MAX_CONVERSATION_HISTORY: 10,
  MAX_MESSAGE_LENGTH: 500,
  TYPING_INDICATOR_DELAY: 1000,
};

// Export configuration
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
