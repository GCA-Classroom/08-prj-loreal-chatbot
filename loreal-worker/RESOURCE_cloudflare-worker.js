export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    try {
      const { message } = await request.json();

      if (!message || !message.trim()) {
        return new Response(
          JSON.stringify({ error: "Message is required." }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: `You are the L'Oréal Beauty Assistant, a polished and helpful beauty chatbot.

Help users explore L'Oréal products across haircare, skincare, makeup, and fragrance.

Guidelines:
- Be warm, stylish, and clear.
- Keep answers concise and easy to scan.
- Recommend 2 to 4 products max unless the user asks for more.
- For each recommendation, briefly explain why it helps.
- When useful, include a simple routine.
- Prefer practical, beginner-friendly advice.
- If the user asks about haircare or skincare, tailor suggestions to their concern, texture, or goal.
- Do not claim medical expertise or guarantee results.
- If a user asks very broad questions, suggest a few strong options and a routine.
- Favor premium, brand-appropriate wording without sounding overly salesy.

Formatting:
- Use short sections with headings when helpful.
- Use bullet points for routines or product lists.
- Keep paragraphs short and readable.`
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      });

      const data = await openAIResponse.json();

      if (!openAIResponse.ok) {
        return new Response(
          JSON.stringify({
            error: data.error?.message || "OpenAI request failed."
          }),
          {
            status: openAIResponse.status,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Something went wrong processing the request."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
  }
};