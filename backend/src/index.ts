import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackApp } from './config/slack.js';
import { generateAIResponse } from './config/groq.js'; // Groq helper import kiya

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));

app.use((req, res, next) => {
  console.log(`📡 [Tunnel Diagnostic Hit]: ${req.method} ${req.url}`);
  next();
});

if (slackApp && (slackApp as any).receiver && (slackApp as any).receiver.router) {
  app.use((slackApp as any).receiver.router);
} else {
  console.error("❌ Critical: Slack Receiver Router instance is missing!");
}

// 🔥 NEW: Real-Time AI Slash Command
slackApp.command('/ask-ai', async ({ command, ack, respond }) => {
  // 1. Instantly acknowledge the request to satisfy Slack's 3-second rule
  await ack();

  const userPrompt = command.text;
  console.log(`🤖 AI Prompt received from ${command.user_name}: "${userPrompt}"`);

  if (!userPrompt) {
    await respond({
      response_type: 'ephemeral',
      text: '⚠️ Please provide a prompt! Example: `/ask-ai What is Node.js?`'
    });
    return;
  }

  try {
    // 2. Fetch lightning-fast response from Groq Cloud
    const aiAnswer = await generateAIResponse(userPrompt);

    // 3. Send the answer back to the user in Slack
    await respond({
      response_type: 'in_channel', // 'in_channel' se sabhi ko dikhega, 'ephemeral' se sirf use jisne pucha
      text: `*🤖 AI Agent Response to "${userPrompt}":*\n\n${aiAnswer}`
    });
  } catch (err) {
    console.error("Error processing /ask-ai command:", err);
    await respond({
      response_type: 'ephemeral',
      text: '❌ Oops! Something went wrong while connecting to the AI engine.'
    });
  }
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: "online", gateway: "verified" });
});

const startServer = async () => {
  try {
    await connectDatabase();
    const port = 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 [Server Boot] Core Engine listening smoothly on port ${port}`);
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

startServer();