import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Serve static files
app.use(express.static(__dirname));
app.use(express.json());

// Endpoint to analyze text
app.post("/analyze", async (req, res) => {
  try {  
    const { text } = req.body;
    console.log("Analyzing text:", text);

    // Extract last 7 words
    const words = text.trim().split(/\s+/);
    const last7 = words.slice(-7).join(' ');

    // 1. Analyze the whole text
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analyzer. Analyze the emotional tone of the given text and respond with the most appropriate sentiment from the following list ONLY: fear, neutrality, anger, sadness, joy. You must respond with exactly one of these words, lowercase, no punctuation or additional text."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 5
    });

    const overallSentiment = completion.choices[0].message.content.trim().toLowerCase();
    console.log("Raw GPT response (overall):", completion.choices[0].message.content);
    console.log("Processed overall sentiment:", overallSentiment);

    // 2. Analyze the last 7 words in context
    const contextPrompt = `You are a sentiment analyzer. Given the full text and the last 7 words, analyze the emotional tone of the last 7 words in relation to the whole text. Respond with the most appropriate sentiment from the following list ONLY: fear, neutrality, anger, sadness, joy, or 'no change' if the overall sentiment should remain. You must respond with exactly one of these words, lowercase, no punctuation or additional text.\n\nFull text: ${text}\nLast 7 words: ${last7}`;

    const last7Completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: contextPrompt
        },
        {
          role: "user",
          content: last7
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const last7Sentiment = last7Completion.choices[0].message.content.trim().toLowerCase();
    console.log("Raw GPT response (last 7):", last7Completion.choices[0].message.content);
    console.log("Processed last 7 sentiment:", last7Sentiment);

    // 3. Decide final sentiment
    let finalSentiment = overallSentiment;
    if (last7Sentiment !== 'no change' && last7Sentiment !== overallSentiment) {
      finalSentiment = last7Sentiment;
    }

    // Broadcast the sentiment to all connected clients
    io.sockets.emit('sentiment', finalSentiment);

    res.json({ sentiment: finalSentiment });
  } catch (error) {
    console.error("Error analyzing text:", error);
    res.status(500).json({ error: "Failed to analyze text" });
  }
});

// Endpoint to save a new emotion
app.post('/save_emotion', async (req, res) => {
  try {
    const { emotionName, emotion } = req.body;
    
    // Read current emotions
    const emotionsPath = path.join(__dirname, 'emotions_dataset.json');
    const emotionsData = await fs.readFile(emotionsPath, 'utf8');
    const emotions = JSON.parse(emotionsData);
    
    // Add new emotion
    emotions[emotionName] = emotion;
    
    // Write back to file with pretty formatting
    await fs.writeFile(emotionsPath, JSON.stringify(emotions, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving emotion:', error);
    res.status(500).json({ error: 'Failed to save emotion' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 