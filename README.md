# Project 8: L'Oréal Chatbot

L’Oréal is exploring the power of AI, and your job is to showcase what's possible. Your task is to build a chatbot that helps users discover and understand L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

Choose English, simplified Mandarin Chinese, Spanish, or Portuguese from the language menu. The interface and new advisor replies use the selected language; existing messages stay in the language they were written in. A new chat keeps your current language selection.

## ☁️ Cloudflare Note

The chatbot sends messages to the class-hosted Cloudflare Worker configured in `script.js`. No API key is needed in this project. If your instructor provides a different Worker URL, replace the `workerUrl` value in `script.js`.

The Worker must accept a `messages` array and return an OpenAI-compatible response containing `data.choices[0].message.content`. Conversation history is kept in the current page until you select **New chat** or reload. Messages are sent to the Worker, so avoid sharing sensitive personal information.

If requests fail because the page's origin is not allowed, ask your instructor to allow your preview or deployment URL in the Worker.

The advisor gives general beauty guidance, not medical advice. Product details and availability should be checked before purchasing.

Enjoy building your L’Oréal beauty assistant! 💄
