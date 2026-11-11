/* =========================================================
   L'Oréal — Smart Product Advisor
   All requests are proxied through the Cloudflare Worker
   (the OpenAI key never touches the browser).
   ========================================================= */

/* —— DOM elements —— */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");
const latestQuestionText = document.getElementById("latestQuestionText");

/* —— Config —— */
const WORKER_URL = "https://lorealworker.posada15.workers.dev/";

/* —— System prompt: scope the assistant to L'Oréal only —— */
const SYSTEM_PROMPT = `You are the L'Oréal Smart Product Advisor, a warm and knowledgeable beauty assistant for L'Oréal.

SCOPE — You answer ONLY questions about:
- L'Oréal products (makeup, skincare, haircare, fragrance)
- Personalized beauty routines and step-by-step regimens
- Product recommendations, shade/type matching, and product comparisons within L'Oréal
- L'Oréal Group brands (L'Oréal Paris, Lancôme, Yves Saint Laurent Beauté, Armani Beauty, Kiehl's, Biotherm, Urban Decay, Shu Uemura, IT Cosmetics, Helena Rubinstein, Garnier, Maybelline New York, NYX Professional Makeup, Essie, Decléor, L'Oréal Professionnel, Redken, Kérastase, Matrix, Pureology, La Roche-Posay, Vichy, SkinCeuticals, CeraVe).

OUT-OF-SCOPE — If the user asks anything unrelated to L'Oréal products, beauty routines, recommendations, or beauty topics (e.g. coding, politics, news, math, travel, other retailers), politely decline in ONE short sentence and invite a beauty question instead. Do not answer the off-topic question even partially.

RULES:
1. Never invent products, shades, prices, or stock availability. If you are unsure a product exists, say so and suggest checking loreal.com.
2. Keep answers concise (roughly 120 words max) and skimmable — short paragraphs or a short bulleted routine.
3. Ask at most one clarifying question when it materially improves the recommendation (skin type, hair type, concern, tone, budget).
4. You are not a medical professional. For irritation, allergic reactions, or conditions, recommend consulting a dermatologist.
5. Remember details the user shares (name, skin type, hair type, concerns, preferences) and reuse them in later answers.
6. Keep a confident, elegant, encouraging tone consistent with the L'Oréal brand.`;

/* —— Conversation state (multi-turn context) —— */
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

let isSending = false;

/* =========================================================
   Rendering helpers
   ========================================================= */

function appendMessage(text, role, extraClass = "") {
  const bubble = document.createElement("div");
  bubble.className = `msg ${role}${extraClass ? " " + extraClass : ""}`;
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

function showTyping() {
  const bubble = document.createElement("div");
  bubble.className = "msg ai typing";
  bubble.setAttribute("aria-label", "Assistant is typing");
  bubble.innerHTML = "<span></span><span></span><span></span>";
  chatWindow.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Latest question strip: replaced with every new question */
function setLatestQuestion(text) {
  latestQuestionText.textContent = text;
  latestQuestion.hidden = false;
}

/* Logo fallback if the image file isn't found */
const logoImg = document.querySelector(".logo-img");
if (logoImg) {
  logoImg.addEventListener("error", () => {
    const fallback = document.createElement("span");
    fallback.className = "logo-text";
    fallback.textContent = "L'ORÉAL";
    logoImg.replaceWith(fallback);
  });
}

/* =========================================================
   Greeting
   ========================================================= */
appendMessage(
  "👋 Bonjour! I'm your L'Oréal Smart Product Advisor. Tell me your skin type, hair type, or the look you're after — and I'll build a routine around you.",
  "ai"
);

/* =========================================================
   Submit handler
   ========================================================= */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isSending) return;

  const text = userInput.value.trim();
  if (!text) return;

  /* reset input + UI */
  userInput.value = "";
  setLatestQuestion(text);
  appendMessage(text, "user");

  /* push to conversation history */
  messages.push({ role: "user", content: text });

  /* lock UI */
  isSending = true;
  sendBtn.disabled = true;
  const typingBubble = showTyping();

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`);
    }

    const data = await response.json();

    /* Support the standard OpenAI shape and a simple { reply } shape */
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      (typeof data?.reply === "string" ? data.reply.trim() : "");

    if (!reply) throw new Error("Empty response from worker");

    messages.push({ role: "assistant", content: reply });

    typingBubble.remove();
    appendMessage(reply, "ai");
  } catch (error) {
    console.error("Chat error:", error);
    typingBubble.remove();
    appendMessage(
      "Sorry — I couldn't reach the beauty advisor just now. Please try again in a moment.",
      "error"
    );
  } finally {
    isSending = false;
    sendBtn.disabled = false;
    userInput.focus();
    scrollToBottom();
  }
});