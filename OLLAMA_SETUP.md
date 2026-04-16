# TasteAI - Ollama Integration Setup Guide

## Overview
This guide walks you through setting up the AI chat feature with Ollama Qwen for personalized restaurant recommendations based on budget and cuisine preferences.

## Features
- 🤖 **AI Chat**: Talk to TasteAI to get personalized recommendations
- 💰 **Budget Filtering**: Specify your budget and get restaurants within that price range
- 🍽️ **Cuisine Selection**: Filter by cuisine type (Italian, Tunisian, etc.)
- 📸 **Restaurant Cards**: AI shows recommended restaurants with images
- 💬 **Context-Aware**: AI remembers your budget and preferences throughout the chat

## Prerequisites
- Node.js (v16 or higher)
- Ollama installed locally
- Qwen model pulled in Ollama

## Step 1: Install & Run Ollama

### Download Ollama
Visit [ollama.ai](https://ollama.ai) and download the version for your OS (Windows, Mac, or Linux)

### Pull the Qwen Model
Open terminal/command prompt and run:
```bash
ollama pull qwen
```

This downloads the Qwen model (lightweight AI model optimized for recommendations).

### Run Ollama Server
```bash
ollama serve
```

The Ollama server will start on `http://localhost:11434` by default.

**Keep this terminal window open** - the server needs to run while you use the app.

## Step 2: Backend Setup

### Install Dependencies
```bash
cd backend
npm install
```

### Create .env file
Create a `.env` file in the backend directory:
```
OLLAMA_API_URL=http://localhost:11434
PORT=5000
```

### Run Backend Server
```bash
npm run dev
```

The backend will start on `http://localhost:5000`

## Step 3: Frontend Setup

### Install Dependencies
```bash
cd frontend-react
npm install
```

### Run Frontend
```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is in use)

## Step 4: Use the Chat Feature

1. Navigate to the homepage
2. Click **"Talk to TasteAI"** button (green button in navbar)
3. (Optional) Set a **Budget** (e.g., 50 TND)
4. (Optional) Set a **Cuisine Type** (e.g., Italian)
5. Chat with TasteAI, e.g.:
   - "I'm looking for a nice restaurant with a budget of 50 TND"
   - "Show me Italian restaurants nearby"
   - "What's good around here?"

The AI will:
- Analyze your message and preferences
- Query the database for matching restaurants
- Return personalized recommendations with restaurant cards
- Show restaurant images and affordability info

## API Endpoints

### POST `/api/ai/chat`
Send a message to TasteAI and receive AI-generated recommendations.

**Request:**
```json
{
  "message": "I want Italian food with budget 50",
  "budget": 50,
  "cuisine": "Italian"
}
```

**Response:**
```json
{
  "reply": "I found great Italian restaurants within your budget..."
}
```

### POST `/api/ai/recommend`
Get filtered restaurant recommendations without full AI generation.

**Request:**
```json
{
  "budget": 50,
  "cuisine": "Italian"
}
```

**Response:**
```json
{
  "count": 3,
  "recommendations": [
    {
      "id": "_id",
      "name": "Restaurant Name",
      "category": "Italian",
      "rating": 4.5,
      "address": "...",
      "image": "...",
      "affordableItems": [...]
    }
  ]
}
```

## Troubleshooting

### Error: "Ollama service is not running"
- Make sure Ollama is running: `ollama serve` in terminal
- Check Ollama is accessible at `http://localhost:11434`

### Error: "Cannot find module 'EXPRESS_MODULE'"
```bash
cd backend
npm install
```

### AI responses are slow
- First request after startup may take 10-30 seconds
- Qwen model is lightweight but needs time to generate responses
- Subsequent requests are faster

### Chat modal not opening
- Refresh the browser page
- Check console for JavaScript errors (F12 → Console)

### Recommendations not showing
- Make sure you have restaurants in the database
- Check backend server is running on port 5000
- Verify MongoDB connection is working

## Production Setup

For production deployment:

1. Update `.env` OLLAMA_API_URL to your production Ollama server
2. Set `NODE_ENV=production`
3. Build frontend: `npm run build`
4. Use a process manager like PM2 for Node.js

```bash
npm install -g pm2
cd backend
pm2 start server.js --name "tastematch-backend"
```

## Architecture

```
Frontend (React)
    ↓
ChatModal Component (budget + cuisine filters)
    ↓
HomePage with "Talk to TasteAI" button
    ↓
Fetch → /api/ai/chat
    ↓
Backend Express Server
    ↓
Fetch → Ollama API (http://localhost:11434)
    ↓
Qwen Model (generates recommendations)
    ↓
Database Query (filtered restaurants)
    ↓
Response with restaurants + images + affordability
```

## Tips for Better Results

1. **Be specific in your chat**: "I want spicy food under 30 TND" works better than "food"
2. **Set budget first**: The AI uses budget to filter results
3. **Specify cuisine**: Helps narrow down recommendations
4. **Let AI ask questions**: If unclear, TasteAI will ask clarifying questions

## Files Modified/Created

- ✅ `backend/routes/ai.js` - New AI route handler
- ✅ `frontend-react/src/components/ChatModal.jsx` - New chat modal component
- ✅ `frontend-react/src/pages/HomePage.jsx` - Updated to use ChatModal

## Next Steps

- Add more restaurant data to database for better recommendations
- Fine-tune the AI system prompt for better recommendations
- Add restaurant ratings/reviews from users
- Integrate with maps for location-based filtering
- Add order history for personalized learning

---

Need help? Check error messages in browser console (F12) or backend terminal logs.
