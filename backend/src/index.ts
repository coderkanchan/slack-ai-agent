import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackApp } from './config/slack.js';
import { generateAIResponse } from './config/groq.js';

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

slackApp.command('/ask-ai', async ({ command, ack, respond }) => {
  // 1. Instantly acknowledge the request to Slack
  await ack();

  const userPrompt = command.text;

  if (!userPrompt) {
    await respond({
      response_type: 'ephemeral',
      text: '⚠️ Please provide a prompt! Example: `/ask-ai What is Node.js?`'
    });
    return;
  }

  // 2. Pure blocks layout for loading state
  await respond({
    response_type: 'in_channel',
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `⏳ *VibeCheck-Bot is thinking...*\n• _Analyzing: "${userPrompt}"_\n• _Fetching from Groq Cloud..._`
        }
      }
    ]
  });

  try {
    // 3. Get fast response from Groq
    const aiAnswer = await generateAIResponse(userPrompt);

    // 4. 🔥 Complete replacement with mirror blocks layout
    await respond({
      response_type: 'in_channel',
      replace_original: true, 
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🤖 *AI Agent Response to "${userPrompt}":*\n\n${aiAnswer.trim()}`
          }
        }
      ]
    });

  } catch (err) {
    console.error("Error processing /ask-ai command:", err);
    await respond({
      response_type: 'ephemeral',
      replace_original: true,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: '❌ Oops! Something went wrong while connecting to the AI engine.'
          }
        }
      ]
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