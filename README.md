# Project 8: L'Oréal Chatbot

L’Oréal is exploring the power of AI, and your job is to showcase what's possible. Your task is to build a chatbot that helps users discover and understand L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

## ☁️ Cloudflare Note

When deploying through Cloudflare, make sure your API request body (in `script.js`) includes a `messages` array and handle the response by extracting `data.choices[0].message.content`.

### Create and deploy the Worker

1. In the Cloudflare dashboard, open **Workers & Pages** and create a Worker.
2. Open the Worker editor and replace its code with the contents of `RESOURCE_cloudflare-worker.js`.
3. In the Worker settings, open **Variables and Secrets** and add a secret named `OPENAI_API_KEY`. Paste your API key directly into the Cloudflare dashboard; never add it to a project file or chat.
4. Deploy the Worker and copy its `workers.dev` URL for your frontend's `fetch` request.

The Worker returns OpenAI's error status and response when an API request fails. Configure Cloudflare rate limiting for the public Worker to reduce the risk of unwanted usage.

Enjoy building your L’Oréal beauty assistant! 💄
