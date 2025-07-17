// Copy this code into your Cloudflare Worker script

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const apiKey = env.OPENAI_API_KEY; // Make sure to name your secret OPENAI_API_KEY in the Cloudflare Workers dashboard
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const userInput = await request.json();

    // Add system message to guide AI behavior for L'Oréal chatbot
    const systemMessage = {
      role: "system",
      content: `You are a helpful L'Oréal beauty assistant. You should only answer questions related to:
- L'Oréal products and brands
- Beauty routines and skincare advice
- Makeup tips and techniques
- Hair care and styling
- Beauty product recommendations
- Cosmetics and personal care

If someone asks about topics unrelated to beauty, cosmetics, or L'Oréal products, politely redirect them back to beauty-related topics. For example: "I'm here to help with L'Oréal products and beauty advice. Is there anything about skincare, makeup, or hair care I can assist you with?"

Always be friendly, helpful, and knowledgeable about beauty and L'Oréal products.`,
    };

    // Combine system message with user messages
    const allMessages = [systemMessage, ...userInput.messages];

    const requestBody = {
      model: "gpt-4o",
      messages: allMessages,
      max_completion_tokens: 300,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  },
};
