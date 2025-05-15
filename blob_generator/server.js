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
    const { fullDialog, latestStatement, currentEmotion } = req.body;
    console.log("Analyzing dialog:", fullDialog);
    console.log("Latest statement:", latestStatement);
    console.log("Current emotion:", currentEmotion);

    // Compose the prompt for GPT
    const prompt = `You are a sentiment analyzer. Given the full dialog and the latest statement, determine if the latest statement (in the context of the full dialog) still represents the current emotion: '${currentEmotion}'. If it does, respond with 'no change'. If it is more closely related to one of the following emotions: fear, anger, sadness, joy, love, curiosity, admiration, confusion, pride, surprise, stress, relief, gratitude, worry respond with the most appropriate emotion from this list (use these exact words only: fear, anger, sadness, joy, love, curiosity, admiration, confusion, pride, surprise, stress, relief, gratitude, worry). Respond with exactly one of these words, lowercase, no punctuation or additional text.\n\nFull dialog: ${fullDialog}\nLatest statement: ${latestStatement}\nCurrent emotion: ${currentEmotion}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: latestStatement
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const gptResponse = completion.choices[0].message.content.trim().toLowerCase();
    console.log("Raw GPT response:", completion.choices[0].message.content);
    console.log("Processed GPT response:", gptResponse);

    // Decide final emotion
    let finalEmotion = currentEmotion;
    if (gptResponse !== 'no change' && gptResponse !== currentEmotion) {
      finalEmotion = gptResponse;
    }

    // Broadcast the emotion to all connected clients
    io.sockets.emit('sentiment', finalEmotion);

    res.json({ sentiment: finalEmotion });
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