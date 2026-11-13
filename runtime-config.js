const codespacesFrontendHost = window.location.hostname.match(
  /^(.+)-8000(\.app\.github\.dev)$/i
);

window.BEAUTY_ADVISOR_WORKER_URL = codespacesFrontendHost
  ? `https://${codespacesFrontendHost[1]}-8787${codespacesFrontendHost[2]}/api/chat`
  : "http://localhost:8787/api/chat";
