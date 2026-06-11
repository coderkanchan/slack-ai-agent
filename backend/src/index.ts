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

slackApp.command('/ask-ai', async ({ command, ack, client }) => {
  await ack();

  (async () => {
    const userPrompt = command.text;
    const channelId = command.channel_id;

    if (!userPrompt) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: command.user_id,
        text: '⚠️ Please provide a prompt! Example: `/ask-ai What is Node.js?`'
      });
      return;
    }

    let loadingMessageTs = "";

    try {
      const loaderResult = await client.chat.postMessage({
        channel: channelId,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `⏳ *VibeCheck-Bot is thinking...*\n• _Analyzing command prompt: "${userPrompt}"_\n• _Fetching from Groq Cloud..._`
            }
          }
        ]
      });

      loadingMessageTs = loaderResult.ts || "";

      const aiAnswer = await generateAIResponse(userPrompt);

      if (loadingMessageTs) {
        await client.chat.update({
          channel: channelId,
          ts: loadingMessageTs,
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
      }

    } catch (err) {
      console.error("Error processing /ask-ai command:", err);

      if (loadingMessageTs) {
        await client.chat.update({
          channel: channelId,
          ts: loadingMessageTs,
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
    }
  })();
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