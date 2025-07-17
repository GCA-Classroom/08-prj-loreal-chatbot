# 🚀 Cloudflare Worker Deployment Guide

## Step 1: Create a Cloudflare Account

1. Go to [Cloudflare.com](https://www.cloudflare.com/)
2. Sign up for a free account
3. Navigate to the Workers & Pages section

## Step 2: Create a New Worker

1. Click "Create Application"
2. Choose "Create Worker"
3. Give your worker a name (e.g., `loreal-chatbot-api`)
4. Click "Deploy"

## Step 3: Replace Worker Code

1. In the worker editor, delete all existing code
2. Copy the entire contents of `RESOURCE_cloudflare-worker.js`
3. Paste it into the worker editor
4. Click "Save and Deploy"

## Step 4: Add Environment Variables

1. In your worker dashboard, go to "Settings" → "Variables"
2. Add a new environment variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (the one from secrets.js)
   - **Type**: Secret (encrypted)
3. Click "Save"

## Step 5: Get Your Worker URL

1. In your worker dashboard, copy the worker URL
2. It will look like: `https://loreal-chatbot-api.your-subdomain.workers.dev`
3. Update the `WORKER_URL` in your `script.js` file

## Step 6: Update Client Code

The client-side code has been updated to use the Cloudflare Worker instead of direct OpenAI API calls.

## Step 7: Test the Deployment

1. Open your chatbot in a browser
2. Try asking a beauty-related question
3. The response should come from your Cloudflare Worker

## Benefits of Using Cloudflare Worker:

- ✅ **Secure API Key**: Your OpenAI API key is hidden from the client
- ✅ **CORS Handling**: Automatic CORS headers for browser compatibility
- ✅ **Rate Limiting**: Built-in protection against API abuse
- ✅ **Global CDN**: Fast response times worldwide
- ✅ **Free Tier**: 100,000 requests per day on free plan

## Troubleshooting:

- If you get CORS errors, make sure the worker is deployed correctly
- If you get 401 errors, check your OpenAI API key in the worker settings
- If the worker doesn't respond, check the worker logs in the dashboard
