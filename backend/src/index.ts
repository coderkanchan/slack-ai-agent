import dotenv from 'dotenv';
dotenv.config();
import pkg from '@slack/bolt';
const { App, ExpressReceiver } = pkg;
import express from 'express';
// @ts-ignore
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { connectDatabase } from './config/db.js';
import dashboardRoutes from './router/dashboardRoutes.js';
import { registerSlackListeners } from './listeners/slackListeners.js';
import logger from './utils/logger.js';
import { httpLogger } from './middlewares/httpLogger.js';

if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
  logger.error({ context: 'System Initialization' }, 'CRITICAL: Missing essential Slack configuration tokens in environment variables.');
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

app.use(httpLogger);

app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use('/api/dashboard', dashboardRoutes);

registerSlackListeners(slackApp);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket']
});

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id, context: 'Socket Stream' }, '⚡ [Socket System] Client node connected securely.');

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id, context: 'Socket Stream' }, '❌ [Socket System] Client node disconnected.');
  });
});

(async () => {
  const runtimePort: number = Number(process.env.PORT) || 5001;
  try {
    await connectDatabase();
    server.listen(runtimePort, () => {
      logger.info(`⚡️ [System Core] Professional Architecture Engine running on port: ${runtimePort}`);
    });
    logger.info(`⚡️ [System Core] Professional Architecture Engine running on port: ${runtimePort}`);
  } catch (initError) {
    logger.error({ error: initError, context: 'System Boot' }, 'System boot failed execution runtime panic.');
    process.exit(1);
  }
})();