import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackRawBodyParser } from './middlewares/slackBodyParser.js';
import { slackApp } from './config/slack.js';

const app = express();

// 1. CORS Configuration
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));

// 2. Global Logging Middleware (Jo terminal mein print kar raha hai)
app.use((req, res, next) => {
  console.log(`📡 [Incoming Request]: ${req.method} ${req.url}`);
  next();
});

// 3. Slack Command Registration (Isko Bolt internally store karega)
slackApp.command('/vibecheck', async ({ command, ack, respond }) => {
  await ack();
  console.log("⚡ Vibecheck command triggered by user:", command.user_name);
  await respond({
    response_type: 'ephemeral',
    text: `🟢 Connection Successful! Server is responding cleanly to /vibecheck.`
  });
});

// 4. FIXED Slack Events Endpoint (Yahan handle ki jagah direct receiver.router chalega)
app.post('/slack/events', slackRawBodyParser, (req: any, res: any) => {
  console.log("📥 Passing execution directly to Bolt framework router...");
  const receiver = (slackApp as any).receiver;

  if (receiver && typeof receiver.router === 'function') {
    // Bolt ka internal routing mechanism handle karega signatures aur commands ko
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

// 5. Standard json parsing parser (Sirf baaki routes ke liye, Slack ke baad)
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// 6. Server Boot Binding
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