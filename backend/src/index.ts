import dotenv from 'dotenv';
dotenv.config();
import pkg from '@slack/bolt';
const { App, ExpressReceiver } = pkg;
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import dashboardRoutes from './router/dashboardRoutes.js';
import { registerSlackListeners } from './listeners/slackListeners.js';

if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
  throw new Error('CRITICAL: Missing essential Slack configuration tokens in environment variables.');
}

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/slack/events',
});

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver,
});

const app = receiver.app;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use('/api/dashboard', dashboardRoutes);

registerSlackListeners(slackApp);

(async () => {
  const runtimePort: number = Number(process.env.PORT) || 5001;
  try {
    await connectDatabase();
    await slackApp.start(runtimePort);
    console.log(`⚡️ Professional Architecture Engine running on port: ${runtimePort}`);
  } catch (initError) {
    console.error('System boot failed execution:', initError);
    process.exit(1);
  }
})();
