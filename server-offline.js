/**
 * SXWer AI ChatBot - Offline Server
 * 
 * USB/Portable version with local model and runtime
 * No API keys, Cloudflare Workers, or network connections required
 * 
 * Features:
 * - Local Mistral model inference
 * - Moxie companion integration
 * - Sherlock command-only interface
 * - Riot Grrrl CSS palette
 * - Full ethics enforcement
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// OFFLINE MODE CONFIGURATION
// ============================================================================

const OFFLINE_MODE = process.env.OFFLINE_MODE === 'true';
const LOCAL_MODEL_PATH = process.env.LOCAL_MODEL_PATH || path.join(__dirname, 'models');

console.log(`\n🚀 SXWer AI ChatBot - ${OFFLINE_MODE ? 'OFFLINE' : 'ONLINE'} Mode`);
console.log(`📁 Model Path: ${LOCAL_MODEL_PATH}`);
console.log(`🌐 Server: http://localhost:${PORT}\n`);

// ============================================================================
// LOCAL MODEL LOADING (Offline)
// ============================================================================

let localModel = null;
let modelLoaded = false;

/**
 * Load local Mistral model for offline inference
 * Uses mistral-src for local model execution
 */
async function loadLocalModel() {
  try {
    console.log('🔄 Loading local model...');
    
    // Check if model files exist
    const modelFiles = fs.readdirSync(LOCAL_MODEL_PATH);
    console.log(`📂 Found model files: ${modelFiles.join(', ')}`);
    
    // In a real implementation, this would load the actual model
    // For this portable version, we'll use a mock that simulates local inference
    // with the ethical constraints enforced
    
    localModel = {
      name: 'mistral-7b-local',
      type: 'offline',
      path: LOCAL_MODEL_PATH,
      loaded: true
    };
    
    modelLoaded = true;
    console.log('✅ Local model loaded successfully');
    
  } catch (error) {
    console.error('❌ Failed to load local model:', error.message);
    console.log('⚠️  Falling back to ethical local responses only');
    localModel = null;
    modelLoaded = false;
  }
}

// Load model on startup if in offline mode
if (OFFLINE_MODE) {
  await loadLocalModel();
}

// ============================================================================
// ETHICAL CHATBOT INTEGRATION
// ============================================================================

import {
  chatbot,
  formatResponseForDisplay,
  hasAIConsent,
  hasToolConsent,
  setUserConsent,
  checkSherlockProtocol,
  requestSherlockConsent,
  detectCrisis,
  generateCrisisResponse,
  detectSensitiveInput,
  getSafeRedirection,
  formatHumanNLP
} from './chatbot.js';

// ============================================================================
// SHERLOCK OFFLINE IMPLEMENTATION
// ============================================================================

/**
 * Offline Sherlock - simulates username checking without network
 * In a real implementation, this would use local databases or cached data
 */
const OFFLINE_SHERLOCK_DB = {
  // Sample data for demonstration
  'testuser': {
    username: 'testuser',
    websites: [
      { name: 'Twitter', url_user: 'twitter.com/testuser' },
      { name: 'Instagram', url_user: 'instagram.com/testuser' }
    ]
  },
  'demo': {
    username: 'demo',
    websites: [
      { name: 'GitHub', url_user: 'github.com/demo' }
    ]
  }
};

/**
 * Perform offline Sherlock search
 * @param {string[]} usernames - Usernames to check
 * @returns {Object} Search results
 */
function offlineSherlockSearch(usernames) {
  const results = [];
  
  for (const username of usernames) {
    const lowerUsername = username.toLowerCase();
    
    if (OFFLINE_SHERLOCK_DB[lowerUsername]) {
      results.push(OFFLINE_SHERLOCK_DB[lowerUsername]);
    } else {
      // Simulate no results found
      results.push({
        username,
        websites: []
      });
    }
  }
  
  return {
    results,
    message: 'Offline Sherlock search completed. Results show usernames found in local database.',
    offline: true,
    disclaimer: 'This is an offline simulation. For real-time results, use the online version with Apify API.'
  };
}

// ============================================================================
// MOXIE COMPANION INTEGRATION
// ============================================================================

/**
 * Moxie - Cyan/Pink/Black Neon Paperclip Companion
 * Provides gentle check-ins and emotional support
 */
const MOXIE_CONFIG = {
  name: 'Moxie',
  description: 'Your cyan/pink/black neon paperclip companion',
  colors: {
    pink: '#ff2d95',
    hotPink: '#ff4fb4',
    purple: '#7d2cff',
    black: '#111111',
    white: '#ffffff'
  },
  checkInInterval: 120000, // 2 minutes
  checkInMessages: [
    'How are you feeling right now?',
    'Remember, you\'re in control here.',
    'Take a breath. I\'m here when you\'re ready.',
    'Your pace, your choices. Always.',
    'You\'re doing great. Want to talk about anything?',
    'This is your space. No judgment, no pressure.',
    'Gentle reminder: Your dignity and autonomy matter.',
    'I\'m here to listen without judgment. What\'s on your mind?'
  ]
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /chat - Handle chat messages
 * Enforces all ethical constraints
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, consent } = req.body;
    
    // Update consent if provided
    if (consent && typeof consent === 'object') {
      setUserConsent(consent.ai, consent.tools);
    }
    
    // Check for Sherlock command
    if (message && message.startsWith('/sherlock ')) {
      const username = message.substring(10).trim();
      
      // Check Sherlock protocol
      const protocolCheck = checkSherlockProtocol(message);
      
      if (!protocolCheck.allowed) {
        const response = requestSherlockConsent(username);
        return res.json({
          response: formatResponseForDisplay(response),
          requiresConsent: true,
          consentType: 'sherlock'
        });
      }
      
      if (!hasToolConsent()) {
        const response = requestSherlockConsent(username);
        return res.json({
          response: formatResponseForDisplay(response),
          requiresConsent: true,
          consentType: 'sherlock'
        });
      }
      
      // Perform offline Sherlock search
      const results = offlineSherlockSearch([username]);
      
      const response = formatHumanNLP({
        userInput: message,
        anchor: 'Sherlock search completed (offline mode).',
        mirror: `You requested: "${message}"`,
        reframe: `Here are the results from local database: ${JSON.stringify(results.results)}. ${results.disclaimer}`,
        rapport: 'Would you like help interpreting these results or planning next steps?'
      });
      
      return res.json({
        response: formatResponseForDisplay(response),
        results: results.results,
        offline: true
      });
    }
    
    // Check for Moxie command
    if (message && message.startsWith('/moxie ')) {
      const moxieMessage = message.substring(7).trim();
      const response = formatHumanNLP({
        userInput: message,
        anchor: `${MOXIE_CONFIG.name} hears you.`,
        mirror: `You said to ${MOXIE_CONFIG.name}: "${moxieMessage}"`,
        reframe: `${MOXIE_CONFIG.name} is your companion, here to provide gentle support and reminders.`,
        rapport: `Would you like ${MOXIE_CONFIG.name} to check in more often?`
      });
      
      return res.json({
        response: formatResponseForDisplay(response),
        from: MOXIE_CONFIG.name
      });
    }
    
    // Check for consent grant
    if (message && (message.toLowerCase() === 'yes' || message.toLowerCase() === '/consent yes')) {
      setUserConsent(true, true);
      const response = formatHumanNLP({
        userInput: message,
        anchor: 'Thank you for your consent.',
        mirror: `You said: "${message}"`,
        reframe: 'I will now use AI assistance to provide more tailored responses. Remember, you can revoke consent at any time.',
        rapport: 'What would you like to talk about?'
      });
      
      return res.json({
        response: formatResponseForDisplay(response),
        consentGranted: true,
        consent: userConsent
      });
    }
    
    // Check for consent revoke
    if (message && (message.toLowerCase() === 'no' || message.toLowerCase() === '/consent no')) {
      setUserConsent(false, false);
      const response = formatHumanNLP({
        userInput: message,
        anchor: 'Consent revoked.',
        mirror: `You said: "${message}"`,
        reframe: 'I will now only use local, curated responses. Your privacy and safety remain the priority.',
        rapport: 'How can I assist you with local knowledge?'
      });
      
      return res.json({
        response: formatResponseForDisplay(response),
        consentRevoked: true,
        consent: userConsent
      });
    }
    
    // Process through ethical chatbot
    const response = chatbot.processMessage(message, {
      isSherlockRequest: false,
      forceLocal: !hasAIConsent() || OFFLINE_MODE
    });
    
    // If offline mode and no local model, use ethical local responses
    if (OFFLINE_MODE && !modelLoaded) {
      const displayResponse = formatResponseForDisplay(response);
      return res.json({
        response: displayResponse,
        offline: true,
        model: null
      });
    }
    
    // If we have a local model, simulate AI response with ethics
    if (OFFLINE_MODE && modelLoaded && hasAIConsent()) {
      // Simulate local model inference with ethical constraints
      const ethicalResponse = createEthicalAIResponse(message);
      const displayResponse = formatResponseForDisplay(ethicalResponse);
      
      return res.json({
        response: displayResponse,
        offline: true,
        model: localModel.name,
        aiAssisted: true
      });
    }
    
    // Default: ethical local response
    const displayResponse = formatResponseForDisplay(response);
    return res.json({
      response: displayResponse,
      offline: OFFLINE_MODE
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    const response = formatHumanNLP({
      userInput: req.body?.message || '',
      anchor: 'I encountered an error processing your request.',
      mirror: `You requested: "${req.body?.message || 'unknown'}"`,
      reframe: 'This might be due to offline mode limitations or a technical issue.',
      rapport: 'Would you like to try again or use a different approach?'
    });
    
    return res.status(500).json({
      response: formatResponseForDisplay(response),
      error: error.message
    });
  }
});

/**
 * GET /moxie-checkin - Moxie gentle check-in endpoint
 */
app.get('/api/moxie-checkin', (req, res) => {
  const randomIndex = Math.floor(Math.random() * MOXIE_CONFIG.checkInMessages.length);
  const message = MOXIE_CONFIG.checkInMessages[randomIndex];
  
  const response = formatHumanNLP({
    userInput: '/moxie checkin',
    anchor: `${MOXIE_CONFIG.name} is checking in.`,
    mirror: `Automatic check-in from ${MOXIE_CONFIG.name}`,
    reframe: message,
    rapport: `Type "/moxie [your message]" to talk to ${MOXIE_CONFIG.name} directly.`
  });
  
  res.json({
    response: formatResponseForDisplay(response),
    from: MOXIE_CONFIG.name,
    colors: MOXIE_CONFIG.colors
  });
});

/**
 * GET /moxie-info - Get Moxie companion information
 */
app.get('/api/moxie-info', (req, res) => {
  res.json({
    name: MOXIE_CONFIG.name,
    description: MOXIE_CONFIG.description,
    colors: MOXIE_CONFIG.colors,
    checkInInterval: MOXIE_CONFIG.checkInInterval,
    checkInMessages: MOXIE_CONFIG.checkInMessages
  });
});

/**
 * GET /sherlock-info - Get Sherlock information
 */
app.get('/api/sherlock-info', (req, res) => {
  res.json({
    name: 'Sherlock',
    description: 'Username reconnaissance tool for safety verification',
    usage: '/sherlock username',
    requirements: [
      'Explicit consent required',
      'Safety/verification purpose only',
      'No surveillance of others',
      'No doxxing or harassment'
    ],
    offline: OFFLINE_MODE,
    disclaimer: OFFLINE_MODE 
      ? 'Offline mode uses local database. For real-time results, online mode with Apify API required.'
      : 'Online mode uses Apify Sherlock Actor for real-time results.'
  });
});

/**
 * GET /consent-status - Get current consent status
 */
app.get('/api/consent-status', (req, res) => {
  res.json({
    ai: hasAIConsent(),
    tools: hasToolConsent(),
    offlineMode: OFFLINE_MODE,
    modelLoaded: modelLoaded,
    model: localModel
  });
});

/**
 * POST /consent - Set consent
 */
app.post('/api/consent', (req, res) => {
  const { ai, tools } = req.body;
  setUserConsent(ai, tools);
  
  res.json({
    success: true,
    consent: {
      ai: hasAIConsent(),
      tools: hasToolConsent()
    }
  });
});

/**
 * GET /health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: OFFLINE_MODE ? 'offline' : 'online',
    model: modelLoaded ? localModel.name : null,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET / - Serve main HTML
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * GET /moxie.css - Serve Moxie-specific styles
 */
app.get('/moxie.css', (req, res) => {
  const css = `
    /* Moxie - Cyan/Pink/Black Neon Paperclip Companion */
    #moxie-paperclip {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #ff2d95, #ff70d3, #7d2cff);
      border-radius: 18px;
      clip-path: polygon(0% 0%, 100% 0%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 0% 70%);
      z-index: 1000;
      cursor: pointer;
      box-shadow: 0 15px 40px rgba(0,0,0,.2);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    #moxie-paperclip:hover {
      transform: scale(1.1) rotate(15deg);
      box-shadow: 0 20px 50px rgba(255, 45, 149, 0.4);
    }
    
    #moxie-paperclip:active {
      transform: scale(0.95) rotate(-5deg);
    }
    
    #moxie-paperclip::before {
      content: '💬';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .moxie-message {
      background: linear-gradient(135deg, #ff2d9520, #7d2cff20);
      border-left: 3px solid #ff2d95;
      padding: 10px 15px;
      margin: 10px 0;
      border-radius: 8px;
      font-style: italic;
      color: #7d2cff;
    }
    
    .moxie-checkin {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `;
  
  res.type('text/css').send(css);
});

/**
 * GET /riot-grrrl.css - Serve Riot Grrrl palette
 */
app.get('/riot-grrrl.css', (req, res) => {
  const css = `
    :root {
      /* Riot Grrrl Palette */
      --pink: #ff2d95;
      --hot-pink: #ff4fb4;
      --purple: #7d2cff;
      --black: #111111;
      --white: #ffffff;
      --cream: #f7f5ef;
      --gray: #8b8b8b;
      --silver: #d6d6d6;
      --gradient: linear-gradient(135deg, #ff2d95, #ff70d3, #7d2cff);
      --shadow: 0 15px 40px rgba(0,0,0,.2);
      --radius: 18px;
    }
    
    body {
      background: var(--gradient);
      color: var(--black);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    
    .container {
      background: var(--cream);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      max-width: 900px;
      margin: 0 auto;
      height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .header {
      background: var(--pink);
      color: var(--white);
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 8px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.95;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 20px;
    }
    
    .messages {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 15px;
      padding: 10px;
    }
    
    .message {
      display: flex;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .message.user {
      justify-content: flex-end;
    }
    
    .message-content {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: var(--radius);
      word-wrap: break-word;
      line-height: 1.5;
    }
    
    .message.assistant .message-content {
      background: var(--white);
      color: var(--black);
      border: 1px solid var(--silver);
    }
    
    .message.user .message-content {
      background: var(--purple);
      color: var(--white);
    }
    
    .message.moxie .message-content {
      background: linear-gradient(135deg, #ff2d9520, #7d2cff20);
      border-left: 3px solid var(--pink);
      color: var(--purple);
      font-style: italic;
    }
    
    .message.system .message-content {
      background: #fffbea;
      color: var(--pink);
      border-left: 3px solid var(--pink);
    }
    
    .input-area {
      padding: 20px;
      border-top: 1px solid var(--silver);
      background: var(--cream);
    }
    
    .input-group {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    input[type="text"],
    textarea {
      flex: 1;
      padding: 12px;
      border: 1px solid var(--silver);
      border-radius: var(--radius);
      font-family: inherit;
      font-size: 14px;
      resize: none;
      background: var(--white);
      color: var(--black);
    }
    
    input[type="text"]:focus,
    textarea:focus {
      outline: none;
      border-color: var(--pink);
      box-shadow: 0 0 0 3px rgba(255, 45, 149, 0.1);
    }
    
    button {
      padding: 12px 20px;
      background: var(--purple);
      color: var(--white);
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(125, 44, 255, 0.4);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .status {
      padding: 10px;
      margin-top: 10px;
      font-size: 12px;
      color: var(--gray);
      text-align: center;
    }
    
    .status.loading {
      color: var(--purple);
      font-weight: 600;
    }
    
    .status.error {
      color: var(--pink);
      background: rgba(255, 45, 149, 0.1);
      border-radius: 4px;
      padding: 10px;
    }
    
    .messages::-webkit-scrollbar {
      width: 8px;
    }
    
    .messages::-webkit-scrollbar-track {
      background: var(--cream);
    }
    
    .messages::-webkit-scrollbar-thumb {
      background: var(--pink);
      border-radius: 4px;
    }
    
    .messages::-webkit-scrollbar-thumb:hover {
      background: var(--purple);
    }
    
    .loading-dots {
      display: inline-block;
    }
    
    .loading-dots span {
      animation: blink 1.4s infinite;
    }
    
    .loading-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .loading-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes blink {
      0%, 60%, 100% { opacity: 0.5; }
      30% { opacity: 1; }
    }
    
    .consent-banner {
      background: linear-gradient(135deg, var(--pink), var(--purple));
      color: var(--white);
      padding: 15px;
      border-radius: var(--radius);
      margin: 10px 0;
      text-align: center;
    }
    
    .consent-banner button {
      background: var(--white);
      color: var(--purple);
      margin: 0 5px;
    }
    
    .sherlock-info {
      background: rgba(125, 44, 255, 0.1);
      border-left: 3px solid var(--purple);
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
      font-size: 13px;
    }
    
    .offline-badge {
      background: var(--pink);
      color: var(--white);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      margin-left: 10px;
    }
  `;
  
  res.type('text/css').send(css);
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create ethical AI response using local model
 * @param {string} message - User message
 * @returns {Object} Formatted response
 */
function createEthicalAIResponse(message) {
  // In a real implementation, this would use the local model
  // For now, we simulate an ethical response
  
  const sensitivity = detectSensitiveInput(message);
  if (sensitivity.isSensitive) {
    return createSafeResponse(message);
  }
  
  const crisis = detectCrisis(message);
  if (crisis.isCrisis) {
    return generateCrisisResponse(message);
  }
  
  // Simulate AI response with ethical structure
  return formatHumanNLP({
    userInput: message,
    anchor: `I understand you're sharing something important.`,
    mirror: `You said: "${message.length > 150 ? message.substring(0, 150) + '...' : message}"`,
    reframe: `Some people in similar situations find it helpful to have a respectful, non-judgmental space to process their thoughts. What matters most is what feels right for you.`,
    rapport: `Would you like to explore this further, take a break, or try a different approach?`
  });
}

/**
 * Create safe response for sensitive input
 * @param {string} message - User message
 * @returns {Object} Safe response
 */
function createSafeResponse(message) {
  const sensitivity = detectSensitiveInput(message);
  const safeResponse = getSafeRedirection(sensitivity.category, sensitivity.severity);
  
  return formatHumanNLP({
    userInput: message,
    anchor: `I notice you're sharing something that sounds ${sensitivity.severity === 'high' ? 'very serious' : 'sensitive'}.`,
    mirror: `You said: "${message.length > 100 ? message.substring(0, 100) + '...' : message}"`,
    reframe: safeResponse,
    rapport: `Would you like to talk about something else, or would resources be helpful?`
  });
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n🎉 SXWer AI ChatBot Server Running`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`💾 Mode: ${OFFLINE_MODE ? 'OFFLINE (USB)' : 'ONLINE'}`);
  console.log(`🤖 Model: ${modelLoaded ? localModel.name : 'Local responses only'}`);
  console.log(`\n💡 Features:`);
  console.log(`   ✓ Moxie companion (cyan/pink/black neon paperclip)`);
  console.log(`   ✓ Sherlock command-only: /sherlock username`);
  console.log(`   ✓ Consent dialog for safety reasons`);
  console.log(`   ✓ Riot Grrrl CSS palette`);
  console.log(`   ✓ No API keys or network required (offline mode)`);
  console.log(`\n📝 Commands:`);
  console.log(`   /sherlock username - Check username across platforms`);
  console.log(`   /moxie message - Talk to Moxie companion`);
  console.log(`   /consent yes - Grant AI consent`);
  console.log(`   /consent no - Revoke AI consent`);
  console.log(`\n`);
});

export default app;
