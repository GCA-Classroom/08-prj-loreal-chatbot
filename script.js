// ---------- Setup ----------
const WORKER_URL = "https://curly-math-164e.jlee414.workers.dev"; // Cloudflare Worker URL
const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.3;

// ---------- Conversation memory (LevelUp) ----------
window.chatHistory = [
  {
    role: "system",
    content:
      "You are the L’Oréal Assistant. Answer only about L’Oréal makeup, skincare, haircare, and fragrance products. Politely refuse unrelated topics.",
  },
];

// ---------- DOM elements ----------
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// ---------- Helpers ----------
function addBubble(role, text) {
  const div = document.createElement("div");
  div.className = role === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;                 // 안전한 텍스트 출력
  div.classList.add("pop-in");            // 등장 애니메이션
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return div;
}

function showQuestionBanner(text) {
  const old = chatWindow.querySelector(".question-banner");
  if (old) old.remove();
  const banner = document.createElement("div");
  banner.className = "question-banner";
  banner.setAttribute("aria-live", "polite");
  banner.innerHTML = `<strong>Q:</strong> ${text}`;
  chatWindow.appendChild(banner);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ---------- Initial message ----------
addBubble("bot", "💬 Hi there! Ask me anything about L’Oréal products.");

// ---------- Handle form submit ----------
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = userInput.value.trim();
  if (!question) return;

  // 사용자 메시지 + 질문 배너
  addBubble("user", question);
  userInput.value = "";
  showQuestionBanner(question);

  // 로딩 말풍선
  const loadingEl = addBubble("bot", "Thinking...");

  try {
    // 대화 히스토리에 추가
    window.chatHistory.push({ role: "user", content: question });

    // Cloudflare Worker로 전체 히스토리 전달
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: window.chatHistory,
        temperature: TEMPERATURE,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`${response.status} ${response.statusText}\n${errText}`);
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      "(No response — check your Worker URL or key.)";

    // 히스토리에 봇 응답 저장 + UI 업데이트
    window.chatHistory.push({ role: "assistant", content: reply });
    loadingEl.textContent = reply;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (err) {
    console.error(err);
    loadingEl.textContent = `Error: ${err.message}`;
  }
});
