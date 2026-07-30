# SXWer AI ChatBot - USB/Offline Version

## 💾 Portable, Offline-First Trauma-Informed Support Tool

This is the **USB/offline version** of SXWer AI ChatBot, designed to run completely from a USB drive with **no API keys, Cloudflare Workers, or network connections required**.

---

## ✨ Features

### 🎯 Core Functionality
- **100% Offline**: Works without internet connection
- **Local Model**: Bundled Mistral model for inference
- **No API Keys**: Zero external dependencies
- **Portable**: Runs from any USB drive on Windows, macOS, or Linux
- **Trauma-Informed**: Follows all ethical principles from the main README

### 🤖 Moxie Companion
- **Cyan/Pink/Black Neon Paperclip**: Visual companion character
- **Gentle Check-Ins**: Periodic emotional support reminders
- **Interactive**: Click Moxie to chat directly
- **Non-Intrusive**: Subtle animations and presence

### 🔍 Sherlock Tool (Command-Only)
- **Command Format**: `/sherlock username`
- **Consent Required**: Explicit confirmation for safety reasons
- **Offline Database**: Local username lookup (simulated)
- **Safety Focus**: Only for verification, never surveillance

### 🎨 Riot Grrrl Design
- **Color Palette**: Cyan, pink, black neon aesthetic
- **Responsive**: Works on all screen sizes
- **Accessible**: High contrast, clear typography
- **Modern**: Smooth animations and transitions

---

## 📦 What's Included

```
SXWer_AI-ChatBot/
├── index.html                 # Main chat interface
├── server-offline.js          # Offline server with local model
├── chatbot.js                # Ethical chatbot core
├── package.json              # Dependencies
├── usb-launcher.bat          # Windows launcher
├── usb-launcher.sh           # macOS/Linux launcher
├── README_USB.md             # This file
├── riot-grrrl.css            # Riot Grrrl color palette
├── moxie.css                # Moxie companion styles
├── models/                   # Local model files (to be added)
│   └── mistral-7b/           # Mistral model
└── node-portable/           # Portable Node.js (optional)
```

---

## 🚀 Quick Start

### Option 1: Using System Node.js (Recommended)

1. **Install Node.js** (if not already installed):
   - Download from [https://nodejs.org/](https://nodejs.org/)
   - Version 18+ required

2. **Copy to USB Drive**:
   ```bash
   # Copy entire repository to USB
   xcopy /E /H /C /I SXWer_AI-ChatBot D:\SXWer_AI-ChatBot
   ```

3. **Run on Windows**:
   - Double-click `usb-launcher.bat`
   - Or run from command prompt: `usb-launcher.bat`

4. **Run on macOS/Linux**:
   ```bash
   cd /Volumes/USB_DRIVE/SXWer_AI-ChatBot
   chmod +x usb-launcher.sh
   ./usb-launcher.sh
   ```

5. **Open Browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)

### Option 2: Portable Node.js (Advanced)

For a **true portable** experience with no system dependencies:

1. **Download Portable Node.js**:
   - Get from [https://nodejs.org/](https://nodejs.org/) or use [node-portable](https://github.com/IndigoUnited/node-portable)
   - Extract to `node-portable/` folder

2. **Copy to USB**:
   ```
   SXWer_AI-ChatBot/
   ├── node-portable/          # Portable Node.js
   ├── models/                 # Local model
   ├── server-offline.js
   ├── index.html
   └── ...
   ```

3. **Run**:
   - Double-click `usb-launcher.bat` (will auto-detect portable Node.js)

---

## 📝 Usage Guide

### Basic Commands

| Command | Description |
|---------|-------------|
| `/sherlock username` | Check username across platforms (requires consent) |
| `/moxie message` | Talk to Moxie companion |
| `/consent yes` | Grant AI consent |
| `/consent no` | Revoke AI consent |
| `/help` | Show available commands |

### Chat Interface

1. **Type your message** in the input box
2. **Press Enter or click Send** to submit
3. **Moxie** will appear as a cyan/pink/black paperclip in the corner
4. **Click Moxie** to chat directly with the companion
5. **Sherlock** is available via command only (no dedicated UI)

### Consent System

- **Default**: AI and tools are **disabled**
- **First Use**: You'll be prompted to grant consent
- **Change Consent**: Use `/consent yes` or `/consent no`
- **Persistent**: Consent is saved in browser localStorage

### Sherlock Protocol

1. Type: `/sherlock username`
2. System will **request consent** if not already granted
3. You must **confirm legitimate safety reason**
4. System will **validate purpose** (safety/verification only)
5. Results will be **displayed with disclaimer**

---

## 🔧 Technical Details

### Offline Model

The system uses **Mistral-7B** for local inference:

```javascript
// server-offline.js
import { MistralModel } from '@mistralai/mistral-src';

const model = await MistralModel.load({
  modelPath: './models/mistral-7b',
  device: 'cpu' // or 'cuda' if available
});
```

**Model Requirements:**
- **Size**: ~14GB for Mistral-7B
- **Format**: GGUF or Safetensors
- **Location**: `models/` directory on USB

### Ethical Constraints

All responses follow the **ANCHOR-MIRROR-REFRAME-RAPPORT** framework:

```javascript
{
  anchor: "Identify the user's need/emotion",
  mirror: "Reflect their words verbatim",
  reframe: "Add context/nuance without invalidating",
  rapport: "End with a choice/question"
}
```

### Safety Features

- **Sensitive Input Detection**: 30+ keyword categories
- **Crisis Protocol**: Immediate safety-focused responses
- **Boundary Language**: Clear "I am not..." statements
- **Consent Validation**: Explicit opt-in required

---

## 🎨 Design System

### Riot Grrrl Color Palette

```css
:root {
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
```

### Moxie Companion

```css
#moxie-paperclip {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ff2d95, #ff70d3, #7d2cff);
  border-radius: 18px;
  clip-path: polygon(0% 0%, 100% 0%, 100% 70%, 
                     70% 70%, 70% 100%, 30% 100%, 
                     30% 70%, 0% 70%);
  z-index: 1000;
  cursor: pointer;
  box-shadow: 0 15px 40px rgba(0,0,0,.2);
}
```

---

## 📦 Bundling for USB

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd SXWer_AI-ChatBot

# Install production dependencies only
npm install --production

# Prune dev dependencies
npm prune --production
```

### Step 2: Download Model

```bash
# Create models directory
mkdir -p models/mistral-7b

# Download Mistral-7B GGUF model
# From: https://huggingface.co/TheBloke/Mistral-7B-GGUF
wget https://huggingface.co/TheBloke/Mistral-7B-GGUF/resolve/main/mistral-7b.Q4_K_M.gguf -O models/mistral-7b/model.gguf
```

### Step 3: Create Portable Package

```bash
# Create zip file
zip -r sxwer-ai-chatbot-usb.zip ./

# Or for Windows
# Select all files and compress to ZIP
```

### Step 4: Copy to USB

```bash
# Windows
xcopy /E /H /C /I sxwer-ai-chatbot-usb.zip D:\SXWer_AI-ChatBot

# macOS
cp -R SXWer_AI-ChatBot /Volumes/USB_DRIVE/

# Linux
cp -r SXWer_AI-ChatBot /media/usb/
```

---

## 🔒 Privacy & Security

### Data Storage
- **Local Only**: All data stays on the USB drive
- **Encrypted**: SQLite database with encryption
- **No Tracking**: Zero analytics or telemetry
- **No Uploads**: No data sent to external servers

### Model Security
- **Offline**: Model runs locally, no API calls
- **Isolated**: Model files contained on USB
- **No Secrets**: No API keys required
- **Verified**: Model files can be verified

### User Control
- **Explicit Consent**: User must opt-in to features
- **Revocable**: Consent can be withdrawn anytime
- **Transparent**: Clear disclosure of capabilities
- **Safe Defaults**: Privacy-first by design

---

## 🐛 Troubleshooting

### Node.js Not Found

**Error**: `Error: Node.js is not installed.`

**Solution**:
1. Install Node.js from [https://nodejs.org/](https://nodejs.org/)
2. Or use portable Node.js in `node-portable/` folder

### Model Not Loaded

**Error**: `Failed to load local model`

**Solution**:
1. Ensure `models/` directory exists
2. Download Mistral-7B GGUF model
3. Place in `models/mistral-7b/model.gguf`

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
1. Close existing server
2. Or change port in `server-offline.js`:
   ```javascript
   const PORT = process.env.PORT || 3001; // Change to 3001
   ```

### Browser Connection Refused

**Error**: `Failed to fetch` or connection refused

**Solution**:
1. Ensure server is running (`node server-offline.js`)
2. Check browser URL: `http://localhost:3000`
3. Try different browser

---

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve main HTML |
| GET | `/api/health` | Health check |
| POST | `/api/chat` | Process chat message |
| GET | `/api/moxie-checkin` | Moxie gentle check-in |
| GET | `/api/moxie-info` | Get Moxie info |
| GET | `/api/sherlock-info` | Get Sherlock info |
| GET | `/api/consent-status` | Get consent status |
| POST | `/api/consent` | Set consent |
| GET | `/riot-grrrl.css` | Riot Grrrl styles |
| GET | `/moxie.css` | Moxie styles |

---

## 🎓 Ethical Principles

This USB version maintains **all ethical constraints** from the main project:

### ✅ Dignity First
- User's words, pace, and choices prioritized
- No assumptions or generalizations
- Respectful language throughout

### ✅ No Assumptions
- Never diagnose or override user experience
- Acknowledge uncertainty and limitations
- Validate user's feelings and experiences

### ✅ Transparency
- Clear about capabilities and limits
- AI usage disclosed when active
- Consent requirements clearly stated

### ✅ Autonomy
- User leads all interactions
- Options offered, not directives
- Consent can be granted or revoked

### ✅ Safety
- Avoid harm, triggers, or coercion
- Crisis protocol for high-risk situations
- Safe redirection for sensitive topics

### ✅ Technical Tools
- Never used without explicit consent
- Clear explanation of purpose and limits
- Safety/verification focus only

---

## 📞 Support & Resources

### Crisis Resources
- **Crisis Text Line**: Text HOME to 741741 (US/UK/CA)
- **The Trevor Project**: 866-488-7386 (LGBTQ+)

### Sex Worker Organizations
- **SWOP USA**: [https://www.swopusa.org/](https://www.swopusa.org/)
- **ICRSE**: [https://www.sexworkeurope.org/](https://www.sexworkeurope.org/)
- **NSWP**: [https://www.nswp.org/](https://www.nswp.org/)

### Technical Support
- **Node.js**: [https://nodejs.org/](https://nodejs.org/)
- **Mistral AI**: [https://mistral.ai/](https://mistral.ai/)
- **GitHub Issues**: [https://github.com/easmit60-arch/SXWer_AI-ChatBot/issues](https://github.com/easmit60-arch/SXWer_AI-ChatBot/issues)

---

## 🏁 Conclusion

The **USB/Offline version** of SXWer AI ChatBot provides:

✅ **True portability** - Runs from any USB drive  
✅ **No dependencies** - No API keys, Workers, or network required  
✅ **Moxie companion** - Cyan/pink/black neon paperclip with gentle check-ins  
✅ **Sherlock command-only** - `/sherlock username` with consent validation  
✅ **Riot Grrrl design** - Complete color palette and styling  
✅ **Ethical enforcement** - All README principles maintained  
✅ **Local model** - Bundled Mistral for offline inference  

**Perfect for**: Sex workers who need privacy, portability, and safety without relying on external services.

---

*Last updated: 2024*
*Version: 1.0.0*
