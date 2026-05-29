import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from the current folder
app.use(express.static('.'));

// Initialize the Gemini API client
// It automatically looks for an environment variable named GEMINI_API_KEY
const ai = new GoogleGenAI({});

app.post('/api/generate', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY environment variable." });
    }

    // 1. Format your chat history into the structure Gemini expects
    // Gemini uses 'user' and 'model' (instead of 'assistant')
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 2. Call the current Gemini 1.5 Flash model
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt, // System prompt goes here
        maxOutputTokens: 1200,
      }
    });

    // 3. Reconstruct the response structure so the frontend index.html doesn't break
    const replyText = response.text;
    
    const formattedResponse = {
      content: [
        {
          text: replyText
        }
      ]
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ContentFlow AI (Powered by Gemini) running at http://localhost:${PORT}`);
});