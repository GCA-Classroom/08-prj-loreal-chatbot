import {
  validateMessages,
  isBeautyRelevant,
  buildOpenAIRequest,
  responseForRelevanceStatus
} from "./worker-helpers.js";

const RATE_LIMITS = new Map();
const MAX_REQUEST_BYTES = 24 * 1024;

function createCorsHeaders(request, env) {
  const requestOrigin = request.headers.get("Origin");
  const configuredOrigin = env.FRONTEND_ORIGIN;
  const workerHostname = new URL(request.url).hostname;
  const isLocalWorker = ["localhost", "127.0.0.1"].includes(workerHostname);
  const codespacesWorkerHost = /^(.+)-8787\.app\.github\.dev$/i.exec(workerHostname);
  const allowedOrigins = new Set();
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Vary": "Origin"
  };

  if (!requestOrigin) {
    return headers;
  }

  if (configuredOrigin && configuredOrigin !== "*") {
    try {
      const parsedOrigin = new URL(configuredOrigin);

      if (
        !["http:", "https:"].includes(parsedOrigin.protocol) ||
        parsedOrigin.username ||
        parsedOrigin.password ||
        parsedOrigin.pathname !== "/" ||
        parsedOrigin.search ||
        parsedOrigin.hash
      ) {
        return null;
      }
      allowedOrigins.add(parsedOrigin.origin);
    } catch {
      return null;
    }
  }

  if (isLocalWorker) {
    allowedOrigins.add("http://localhost:8000");
    allowedOrigins.add("http://127.0.0.1:8000");
  }

  if (codespacesWorkerHost) {
    allowedOrigins.add(`https://${codespacesWorkerHost[1]}-8000.app.github.dev`);
  }

  if (!allowedOrigins.has(requestOrigin)) {
    return null;
  }

  headers["Access-Control-Allow-Origin"] = requestOrigin;
  return headers;
}

function enforceRateLimit(request) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const now = Date.now();
  const windowMs = 60_000;
  const current = RATE_LIMITS.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now >= current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }

  current.count += 1;
  RATE_LIMITS.set(ip, current);

  if (RATE_LIMITS.size > 5000) {
    for (const [knownIp, limit] of RATE_LIMITS) {
      if (now >= limit.resetAt) {
        RATE_LIMITS.delete(knownIp);
      }
    }
  }

  return current.count <= 20;
}

export default {
  async fetch(request, env) {
    const headers = createCorsHeaders(request, env);

    if (!headers) {
      return new Response(JSON.stringify({ error: "Origin is not allowed." }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Vary": "Origin" }
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (new URL(request.url).pathname !== "/api/chat") {
      return new Response(
        JSON.stringify({ error: "Endpoint not found." }),
        { status: 404, headers }
      );
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests are accepted." }),
        { status: 405, headers }
      );
    }

    if (!enforceRateLimit(request)) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait a moment before sending another message."
        }),
        { status: 429, headers }
      );
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);

    if (contentLength > MAX_REQUEST_BYTES) {
      return new Response(
        JSON.stringify({ error: "Request body is too large." }),
        { status: 413, headers }
      );
    }

    let rawBody;

    try {
      rawBody = await request.text();
    } catch {
      return new Response(
        JSON.stringify({ error: "Request body could not be read." }),
        { status: 400, headers }
      );
    }

    if (new TextEncoder().encode(rawBody).length > MAX_REQUEST_BYTES) {
      return new Response(
        JSON.stringify({ error: "Request body is too large." }),
        { status: 413, headers }
      );
    }

    let payload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: "Request body must be valid JSON." }),
        { status: 400, headers }
      );
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return new Response(
        JSON.stringify({ error: "Request body must be a JSON object." }),
        { status: 400, headers }
      );
    }

    let messages;

    try {
      messages = validateMessages(payload.messages);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message || "Malformed chat request." }),
        { status: 400, headers }
      );
    }

    if (!isBeautyRelevant(messages)) {
      return new Response(
        JSON.stringify({
          reply: responseForRelevanceStatus(),
          status: "relevance-check"
        }),
        { status: 200, headers }
      );
    }

    const apiKey = env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured on the server." }),
        { status: 503, headers }
      );
    }

    const openAiRequestBody = buildOpenAIRequest(messages);

    let openAiResponse;

    try {
      openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4.1",
          messages: openAiRequestBody.messages,
          temperature: 0.7,
          max_tokens: 350
        })
      });
    } catch {
      return new Response(
        JSON.stringify({
          error: "The beauty advisor is temporarily unavailable. Please try again in a moment."
        }),
        { status: 502, headers }
      );
    }

    if (!openAiResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "The beauty advisor is temporarily unavailable. Please try again in a moment."
        }),
        { status: 502, headers }
      );
    }

    let data;

    try {
      data = await openAiResponse.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "The beauty advisor returned an invalid response." }),
        { status: 502, headers }
      );
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return new Response(
        JSON.stringify({ error: "The model did not return a usable response." }),
        { status: 502, headers }
      );
    }

    return new Response(JSON.stringify({ reply, status: "ok" }), {
      status: 200,
      headers
    });
  }
};
