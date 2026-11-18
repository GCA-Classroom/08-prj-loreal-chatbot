// Copy this code into your Cloudflare Worker script

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    const jsonResponse = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: corsHeaders });

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Only POST requests are supported.' }, 405);
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: 'The OPENAI_API_KEY secret is not configured.' }, 500);
    }

    let userInput;
    try {
      userInput = await request.json();
    } catch {
      return jsonResponse({ error: 'The request body must be valid JSON.' }, 400);
    }

    if (!userInput || !Array.isArray(userInput.messages) || userInput.messages.length === 0) {
      return jsonResponse({ error: 'The request must include a non-empty messages array.' }, 400);
    }

    const requestBody = {
      model: 'gpt-4.1',
      messages: userInput.messages,
      max_completion_tokens: 300,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    return jsonResponse(data, response.status);
  }
};
