export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json"
        }
      });
    }

    try {
      const { messages } = await request.json();

      const openAIResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages
          })
        }
      );

      const data = await openAIResponse.json();

      if (!openAIResponse.ok) {
        return new Response(
          JSON.stringify({
            error: data?.error?.message || "OpenAI request failed",
            details: data
          }),
          {
            status: openAIResponse.status,
            headers: {
              ...corsHeaders(),
              "Content-Type": "application/json"
            }
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Server error",
          details: error.message
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}