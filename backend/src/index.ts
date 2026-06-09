import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackApp } from './config/slack.js';

const app = express();

// 1. Global Middlewares
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));

// 2. Request Logger for Tunnels
app.use((req, res, next) => {
  console.log(`📡 [Tunnel Diagnostic Hit]: ${req.method} ${req.url}`);
  next();
});

// 3. FIXED: Mount Slack Receiver Router directly as Middleware
// Yeh Bolt ke internal express instance ko bina kisi context delay ke connect karega
app.use(slackApp.receiver.router);

slackApp.command('/vibecheck', async ({ command, ack, respond }) => {
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