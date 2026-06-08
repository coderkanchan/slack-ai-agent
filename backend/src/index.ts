import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackRawBodyParser } from './middlewares/slackBodyParser.js';
import { slackApp } from './config/slack.js';

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));

app.use((req, res, next) => {
  console.log(`📡 [Incoming Request]: ${req.method} ${req.url}`);
  next();
});

slackApp.command('/vibecheck', async ({ command, ack, respond }) => {
  await ack();
  console.log("⚡ Vibecheck command triggered by user:", command.user_name);
  await respond({
    response_type: 'ephemeral',
    text: `🟢 Connection Successful! Server is responding cleanly to /vibecheck.`
  });
});

app.post('/slack/events', slackRawBodyParser, (req: any, res: any) => {
  console.log("📥 Passing execution directly to Bolt framework router...");
  const receiver = (slackApp as any).receiver;

  if (receiver && typeof receiver.router === 'function') {
    receiver.router(req, res);
  } else if (receiver && typeof receiver.handle === 'function') {
    receiver.handle(req, res).catch((err: any) => {
      console.error("❌ Bolt receiver execution failure:", err);
      res.status(500).send();
    });
  } else {
    console.error("❌ Slack Receiver instance setup is invalid");
    res.status(404).send('Slack receiver instance missing');
  }
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: "healthy" });
});

const startServer = async () => {
  try {
    await connectDatabase();
    const port = 5000;

    app.listen(port, '127.0.0.1', () => {
      console.log(`🚀 [Server Boot] Clean Diagnostic core running on http://127.0.0.1:${port}`);
    });
  } catch (error) {
    console.error("Database connection failure during boot:", error);
  }
};

startServer();