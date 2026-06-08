import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackRawBodyParser } from './middlewares/slackBodyParser.js';
import { slackApp } from './config/slack.js';

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));

app.use((req, res, next) => {
  console.log(`📡 [Tunnel Diagnostic Hit]: ${req.method} ${req.url}`);
  next();
});

slackApp.command('/vibecheck', async ({ command, ack, respond }) => {
  await ack();
  console.log(`⚡ Command /vibecheck triggered perfectly by: ${command.user_name}`);
  try {
    await respond({
      response_type: 'ephemeral',
      text: `🟢 Connection 100% Successful! Your Slack Bot is now fully linked with the Local Engine.`
    });
  } catch (err) {
    console.error("Error sending message back to Slack:", err);
  }
});

app.post('/slack/events', slackRawBodyParser, async (req: any, res: any) => {
  console.log("📥 Forwarding current payload to Slack Bolt Core Framework...");
  const receiver = (slackApp as any).receiver;
  if (receiver) {
    if (typeof receiver.router === 'function') {
      return receiver.router(req, res);
    } else if (typeof receiver.handle === 'function') {
      try {
        await receiver.handle(req, res);
        return;
      } catch (err) {
        console.error("Bolt execution engine crashed:", err);
        return res.status(500).send();
      }
    }
  }
  return res.status(404).send('Slack Receiver interface context not found');
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