# L'Oréal Smart Routine & Product Advisor

A single-page AI chatbot that helps customers discover L'Oréal products and build personalised beauty routines. Powered by the OpenAI API (GPT-4o) and secured through a Cloudflare Worker proxy so no API key is ever exposed in the browser.

---

## File Structure

```
08-prj-loreal-chatbot/
├── index.html          # Single-page app shell & chat UI
├── style.css           # L'Oréal brand styling (black, white, gold)
├── script.js           # Chat logic — sends messages to the Worker, renders responses
├── worker.js           # Cloudflare Worker proxy (keeps the OpenAI key server-side)
├── img/
│   └── loreal-logo.png # L'Oréal logo used in the header
└── README.md           # This file
```

---

## How It Works

```
Browser (script.js)
    │  POST { messages: [...] }
    ▼
Cloudflare Worker (worker.js)          ← API key lives here, never in the browser
    │  POST to OpenAI with Bearer token
    ▼
OpenAI Chat Completions API (GPT-4o)
    │  { choices[0].message.content }
    ▼
Cloudflare Worker  →  Browser  →  rendered bubble
```

---

## Step 1 — Get an OpenAI API Key

1. Sign in at [platform.openai.com](https://platform.openai.com).
2. Go to **API keys** and create a new secret key.
3. Copy it — you will paste it into Cloudflare in Step 2.

---

## Step 2 — Deploy the Cloudflare Worker

### Option A — Cloudflare Dashboard (no CLI needed)

1. Sign up / log in at [dash.cloudflare.com](https://dash.cloudflare.com).
2. In the left sidebar click **Workers & Pages → Create application → Create Worker**.
3. Give it a name (e.g. `loreal-chatbot`), then click **Deploy**.
4. On the next screen click **Edit code**.
5. Delete all the default code and paste the entire contents of `worker.js`.
6. Click **Save and deploy**.

#### Add the API key as a secret environment variable

7. From the Worker overview page go to **Settings → Variables**.
8. Under **Environment Variables**, click **Add variable**.
9. Set:
   - **Variable name:** `OPENAI_API_KEY`
   - **Value:** your OpenAI key (click the lock icon to make it a Secret)
10. Click **Save and deploy**.
11. Copy the Worker URL shown on the overview page — it looks like:
    `https://loreal-chatbot.<your-subdomain>.workers.dev`

### Option B — Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Authenticate
wrangler login

# Deploy the worker from the project root
wrangler deploy worker.js --name loreal-chatbot --compatibility-date 2024-01-01

# Store the API key as an encrypted secret (you will be prompted to paste the value)
wrangler secret put OPENAI_API_KEY
```

---

## Step 3 — Wire Up the Frontend

Open `script.js` and replace the placeholder on line 9:

```js
// Before
const WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL';

// After (use your actual Worker URL)
const WORKER_URL = 'https://loreal-chatbot.your-subdomain.workers.dev';
```

---

## Step 4 — Test Locally

Because the app is a plain HTML/CSS/JS project with no build step, you can preview it with any static file server:

```bash
# Using the VS Code Live Server extension
# Right-click index.html → "Open with Live Server"

# Or using Python (from the project folder)
python3 -m http.server 8080
# Then open http://localhost:8080
```

---

## Step 5 — Push to GitHub

```bash
# From the project root

# 1. Stage all project files (avoid committing secrets)
git add index.html style.css script.js worker.js README.md img/

# 2. Commit
git commit -m "Add L'Oréal chatbot with Cloudflare Worker proxy"

# 3. Push to main
git push origin main
```

> **Security reminder:** `script.js` contains only a URL, never the actual API key.
> The API key lives exclusively in the Cloudflare Worker environment variables.

---

## Customisation

| What to change | Where |
|---|---|
| OpenAI model (e.g. `gpt-4o-mini`) | `worker.js` — `model` field |
| Max response length | `worker.js` — `max_tokens` |
| Chatbot personality & scope | `script.js` — `SYSTEM_PROMPT` constant |
| Brand colours | `style.css` — `:root` CSS variables |
| Initial greeting message | Bottom of `script.js` — the `appendMessage(…)` call |

---

## CORS Note

`worker.js` currently allows requests from any origin (`'*'`).  
For a production deployment restrict this to your actual frontend domain:

```js
'Access-Control-Allow-Origin': 'https://your-github-pages-site.github.io',
```

---

## License

This project is created for educational purposes as part of a school assignment.  
L'Oréal® and all brand names are trademarks of their respective owners.
