import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackRawBodyParser } from './middlewares/slackBodyParser.js';
import { slackApp } from './config/slack.js';

const app = express();

// Enable CORS
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));

// 1. Debugging Middleware: Yeh terminal mein print karega jab bhi koi request aayegi
app.use((req, res, next) => {
  console.log(`📡 [Incoming Request]: ${req.method} ${req.url}`);
  next();
});

// Register Bolt Slash Command Command
slackApp.command('/vibecheck', async ({ command, ack, respond }) => {
  await ack();
  console.log("⚡ Vibecheck command triggered by user:", command.user_name);
  await respond({
    response_type: 'ephemeral',
    text: `🟢 Connection Successful! Server is responding cleanly to /vibecheck.`
  });
});

app.post('/slack/events', slackRawBodyParser, async (req: any, res: any) => {
  console.log("📥 /slack/events endpoint hit by Ngrok!");
  const receiver = (slackApp as any).receiver;
  if (receiver && typeof receiver.handle === 'function') {
    try {
      await receiver.handle(req, res);
      return;
    } catch (err) {
      console.error("❌ Bolt receiver internal handling crash:", err);
      return res.status(500).send();
    }
  }
  return res.status(404).send('Slack receiver instance missing');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: "healthy" });
});

const startServer = async () => {
  try {
    await connectDatabase();
    const port = 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 [Server Boot] Clean Diagnostic core running on port ${port}`);
    });
  } catch (error) {
    console.error("Database connection failure during boot:", error);
  }
};

startServer();