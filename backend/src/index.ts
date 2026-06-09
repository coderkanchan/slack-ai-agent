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
    const aiAnswer = await generateAIResponse(userPrompt);

    await respond({
      response_type: 'in_channel', 
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