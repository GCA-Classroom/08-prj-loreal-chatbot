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

    try {
      const bodyText = await request.text();
      const body = bodyText ? JSON.parse(bodyText) : {};
      const messages =
        Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : [{ role: "user", content: "Hello!" }];

      const apiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 300,
          }),
        }
      );

      const result = await apiResponse.json();

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error.message }), {
          headers: corsHeaders,
          status: 400,
        });
      }

      return new Response(
        JSON.stringify({
          content:
            result.choices?.[0]?.message?.content || "No response received.",
        }),
        { headers: corsHeaders }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        headers: corsHeaders,
      });
    }
  },
};
