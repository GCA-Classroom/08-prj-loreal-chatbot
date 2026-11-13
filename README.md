# L'Oréal AI Beauty Advisor

This educational demo uses plain HTML, CSS, and JavaScript for the frontend and a Cloudflare Worker for OpenAI requests. The browser never receives the OpenAI API key.

## Requirements

- Node.js 18 or newer
- Python 3 for the local static web server
- Wrangler for Worker/Pages deployment (`npx wrangler`)

No frontend or Worker npm dependencies are required.

## Run locally

1. Make a local vars file and put your replacement key in it:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

   Set `OPENAI_API_KEY` in `.dev.vars`. Keep this file local; it is gitignored. Set `FRONTEND_ORIGIN=http://localhost:8000` for local browser testing.

2. In one terminal, run the Worker:

   ```bash
   npx wrangler dev --port 8787
   ```

3. In a second terminal, serve the frontend:

   ```bash
   python3 -m http.server 8000
   ```

4. Open `http://localhost:8000`. The local frontend config calls `http://localhost:8787/api/chat`.

In GitHub Codespaces, forward ports `8000` and `8787` in the **Ports** panel and open the forwarded port `8000` URL. The local runtime config maps the Codespaces frontend URL to the matching Worker port; the Worker permits only that matching forwarded frontend origin. If chat requests get HTTP 401, the forwarded Worker port is private and the browser cannot authenticate its cross-origin request. For a brief local test only, set port `8787` visibility to **Public**, do not share its URL, and change it back to **Private** when finished. A public Worker endpoint can be abused to consume API quota even though the key itself stays server-side.

Run the focused automated tests with:

```bash
npm test
```

## Secure key handling

- Local development: store the key only in `.dev.vars`.
- Production: set the Cloudflare Worker secret:

  ```bash
  npx wrangler secret put OPENAI_API_KEY
  ```

- Do not add a key to JavaScript, HTML, `runtime-config.js`, `.dev.vars.example`, or any other tracked file.
- If a key has been shared or exposed, revoke it with OpenAI and create a replacement. This project will not rotate credentials automatically.

## Deploy the Worker

Set the allowed frontend origin to the exact production Pages origin (no trailing slash):

```bash
npx wrangler login
npx wrangler deploy --var FRONTEND_ORIGIN:https://YOUR-PAGES-PROJECT.pages.dev
```

Then set the key as a Cloudflare secret:

```bash
npx wrangler secret put OPENAI_API_KEY
```

The local `FRONTEND_ORIGIN` default in `wrangler.jsonc` is `http://localhost:8000`; override it on production deploy. Requests from other browser origins are rejected. The in-memory rate limit is a basic per-isolate safeguard, not a substitute for Cloudflare's production rate-limiting rules.

## Deploy the frontend to Cloudflare Pages

Build output contains only the static page, stylesheet, script, runtime Worker URL, and logo; it does not copy `.dev.vars` or Worker source.

1. Set `WORKER_URL` to the deployed Worker endpoint and build:

   ```bash
   WORKER_URL=https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/chat npm run build:pages
   ```

2. Publish the generated `dist/` folder:

   ```bash
   npx wrangler pages deploy dist --project-name loreal-ai-beauty-advisor
   ```

For a Git-connected Pages project, use `npm run build:pages` as the build command, `dist` as the build output directory, and set `WORKER_URL` as a Pages build environment variable. The build rejects missing, non-HTTPS production URLs, and URLs that do not end in `/api/chat`. Localhost HTTP is accepted for local build checks.

## Verify the secret is not exposed

- Browser requests go only to the Worker URL; OpenAI authentication happens in the Worker.
- The generated Pages `dist/` directory contains no Worker code or secret file.
- Check browser Network tools to confirm requests target the Worker endpoint and do not contain an OpenAI key.
- Confirm `.dev.vars` is not tracked with `git check-ignore .dev.vars`.
