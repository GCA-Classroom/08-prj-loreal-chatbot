/* ============================================================
   L'Oréal Routine Builder — worker.js  (Cloudflare Worker)

   Secure proxy between the frontend and OpenAI.
   Supports standard chat (gpt-4o) and web-search mode
   (gpt-4o-search-preview) via the `webSearch` flag.

   SETUP:
   1. Create / open your Worker in the Cloudflare dashboard.
   2. Paste this file into the editor and save.
   3. Settings > Variables > add Secret: OPENAI_API_KEY
   4. Deploy. The Worker URL goes in script.js → WORKER_URL.
   ============================================================ */

export default {
  async fetch(request, env) {

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return jsonError(405, 'Method Not Allowed', corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, 'Invalid JSON in request body', corsHeaders);
    }

    const { messages, webSearch = false } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonError(400, 'Request body must include a non-empty "messages" array', corsHeaders);
    }

    // gpt-4o-search-preview enables real-time web search.
    // It does not support temperature or max_tokens.
    const model = webSearch ? 'gpt-4o-search-preview' : 'gpt-4o';

    const openAIBody = { model, messages };
    if (!webSearch) {
      openAIBody.max_tokens = 800;
      openAIBody.temperature = 0.7;
    }

    let openAIResponse;
    try {
      openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openAIBody),
      });
    } catch (err) {
      return jsonError(502, `Failed to reach OpenAI: ${err.message}`, corsHeaders);
    }

    const data = await openAIResponse.json();

    return new Response(JSON.stringify(data), {
      status: openAIResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};

function jsonError(status, message, corsHeaders) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
