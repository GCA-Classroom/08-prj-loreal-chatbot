# Cloudflare Worker Setup Guide

Follow these steps to deploy your secure API proxy with Cloudflare Workers.

## Step 1: Create a Cloudflare Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click on **Workers & Pages** in the left sidebar
3. Click **Create application** → **Create Worker**
4. You'll see a default "Hello World" script
5. Replace the entire script with the code from `RESOURCE_cloudflare-worker.js` (copy all the code)
6. Click **Deploy**

## Step 2: Set Your OpenAI API Key as a Secret

1. In your Worker dashboard, click on your newly created Worker
2. Go to **Settings** tab (on the right)
3. Scroll down to **Variables and Secrets**
4. Click **Edit Variables**
5. Click **Add variable**
6. Variable name: `OPENAI_API_KEY` (exact spelling)
7. Value: `iItIgTlPSMuMkhcJaA9rwA7sUyGcis6eAgMVRhvI`
8. Click **Save and deploy**

## Step 3: Get Your Worker URL

1. Go back to the **Overview** tab of your Worker
2. Copy your Worker URL (looks like: `https://your-worker-name.{your-account}.workers.dev`)
3. This is your **CLOUDFLARE_WORKER_URL**

## Step 4: Update script.js

1. Open `script.js` in your editor
2. Find line 21: `const CLOUDFLARE_WORKER_URL = 'https://your-cloudflare-worker-url.workers.dev';`
3. Replace `'https://your-cloudflare-worker-url.workers.dev'` with your actual Worker URL from Step 3
4. Save the file

Example:

```javascript
const CLOUDFLARE_WORKER_URL = "https://beauty-advisor-123abc.us-workers.dev";
```

## Step 5: Test Your Chatbot

1. Open your chatbot in the browser (via Live Server)
2. Type a question like: "What skincare products do you recommend for oily skin?"
3. You should get an L'Oréal-specific product recommendation within a few seconds
4. Try asking something unrelated to beauty - the bot will politely redirect to beauty topics

## Safety Features

✅ **API Key Protection**: Your OpenAI API key is stored securely in Cloudflare's environment variables, not exposed in your frontend code

✅ **CORS Headers**: The Worker includes proper CORS headers to allow requests from your domain

✅ **System Prompt**: Only answers L'Oréal and beauty-related questions

✅ **Token Limit**: Max 300 completion tokens to control costs

## Troubleshooting

**"API Error" appears in chat**

- Check that CLOUDFLARE_WORKER_URL is correct in script.js
- Verify OPENAI_API_KEY secret is set in your Worker
- Check Cloudflare Worker logs in the dashboard (Workers → Your Worker → Logs tab)

**Nothing happens when I send a message**

- Open browser DevTools (F12) → Console tab
- Check for error messages
- Make sure the Worker URL starts with `https://` not `http://`

**"Let me find the perfect recommendation..." message stays**

- The API request timed out. Check your internet connection
- Verify the Worker is deployed and the URL is correct

## Next Steps

After confirming everything works:

1. Consider adding more personality to the SYSTEM_PROMPT in script.js
2. Expand the L'Oréal product knowledge in the system prompt
3. Add more styling to match L'Oréal's brand identity
4. Deploy to a web hosting service for production use
