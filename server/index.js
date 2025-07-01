import express from 'express';
import cors from 'cors';
import { chatWithOpenAI } from './openai.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, messages } = req.body;

    const userPrompt = messages
      ? messages
      : [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt || 'No prompt provided.' } // ✅ This line ensures valid input
        ];

    const response = await chatWithOpenAI(userPrompt);
    res.json(response);
  } catch (err) {
    console.error('🔴 OpenAI Proxy Error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(5000, () => {
  console.log(`🚀 Server running on http://localhost:5000`);
});
