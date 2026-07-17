export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests are supported." }),
        { status: 405, headers: corsHeaders },
      );
    }

    const apiKey = env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY secret." }),
        { status: 500, headers: corsHeaders },
      );
    }

    const body = await request.json().catch(() => ({}));

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Request body must include a messages array.",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: body.messages,
        max_tokens: 300,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (data.error) {
      const isInvalidKey = data.error.code === "invalid_api_key";
      const status = response.ok ? (isInvalidKey ? 401 : 502) : response.status;
      const safeError = isInvalidKey
        ? {
            error: {
              message:
                "The Cloudflare Worker API key is invalid. Update OPENAI_API_KEY in Worker Secrets and deploy again.",
              code: "invalid_api_key",
            },
          }
        : data;

      return new Response(JSON.stringify(safeError), {
        status,
        headers: corsHeaders,
      });
    }

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  },
};
