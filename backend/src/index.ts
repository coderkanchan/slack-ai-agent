import pkg from '@slack/bolt';
const { App, ExpressReceiver } = pkg;
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db.js';
import { GroqService } from './services/groq.js';
import mongoose from 'mongoose';

dotenv.config();

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

const aiOrchestrator = new GroqService();
const app = receiver.app;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.get('/api/dashboard/analytics', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const taskCollection = db ? db.collection('tasks') : null;
    const profileCollection = db ? db.collection('userprofiles') : null;

    const rawTasks = taskCollection ? await taskCollection.find({}).toArray() : [];
    const rawProfiles = profileCollection ? await profileCollection.find({}).toArray() : [];

    return res.status(200).json({
      success: true,
      metrics: {
        totalTasks: rawTasks.length,
        completedTasks: rawTasks.filter(t => t.status === 'COMPLETED').length,
        pendingTasks: rawTasks.filter(t => t.status !== 'COMPLETED').length,
        activeVibeScore: 85
      },
      tasks: rawTasks.map(t => ({ _id: t._id.toString(), title: t.title, status: t.status }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

interface SlackMessageEvent {
  type: string;
  text?: string;
  channel: string;
  ts?: string;
  subtype?: string;
  user?: string;
}

slackApp.command('/ask-ai', async ({ command, ack, client }: any) => {
  await ack();
  const userPrompt: string = command.text.trim();
  const channelId: string = command.channel_id;
  const userId: string = command.user_id;

  if (!userPrompt) {
    await client.chat.postEphemeral({ channel: channelId, user: userId, text: '⚠️ *Invalid Usage*' });
    return;
  }

  let loadingMessageTs = '';
  try {
    const loaderResult = await client.chat.postMessage({ channel: channelId, text: '⏳ Processing...' });
    loadingMessageTs = loaderResult.ts || '';
    const aiResult = await aiOrchestrator.getChatResponse(userId, userPrompt, channelId);
    await client.chat.update({
      channel: channelId,
      ts: loadingMessageTs,
      text: aiResult.text ? aiResult.text.replace(/^getting,\s*/i, '') : '',
      blocks: aiResult.blocks
    });
  } catch (error) {
    console.error('Error:', error);
  }
});

slackApp.message(async ({ message, client }: any) => {
  const msgEvent = message as SlackMessageEvent;
  if (msgEvent.subtype && msgEvent.subtype === 'bot_message') return;

  const rawMessageText: string | undefined = msgEvent.text;
  const channelId: string = msgEvent.channel;
  const userId: string = msgEvent.user || '';

  if (!rawMessageText || rawMessageText.trim() === '' || !userId) return;

  const cleanedMessageText: string = rawMessageText.trim();
  let textMessageTs = '';
  try {
    const responseTracker = await client.chat.postMessage({
      channel: channelId,
      text: `⏳ *VibeCheck-Bot is analyzing text...*`
    });

    textMessageTs = responseTracker.ts || '';
    const aiResponsePayload = await aiOrchestrator.getChatResponse(userId, cleanedMessageText, channelId);

    if (textMessageTs) {
      await client.chat.update({
        channel: channelId,
        ts: textMessageTs,
        text: aiResponsePayload.text,
        blocks: aiResponsePayload.blocks
      });
    }
  } catch (error) {
    console.error('[CRITICAL FAILURE] Error inside text message event:', error);
  }
});

(async () => {
  const runtimePort: number = Number(process.env.PORT) || 5001;
  try {
    await connectDatabase();
    await slackApp.start(runtimePort);
    console.log(`⚡️ Engine running on port: ${runtimePort}`);
  } catch (initError) {
    process.exit(1);
  }
})();