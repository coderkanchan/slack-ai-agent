import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import { slackRawBodyParser } from './middlewares/slackBodyParser.js';
import { slackApp } from './config/slack.js';
import { TaskModel } from './models/Task.js';
import { GroqService } from './services/groq.js';

const app = express();
const groqService = new GroqService();

slackApp.command('/vibecheck', async ({ command, ack, respond }) => {
  await ack();
  try {
    const hostTimestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    await respond({
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '📊 Workspace VibeCheck Diagnostic', emoji: true }
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Requested By:*\n<@${command.user_id}>` },
            { type: 'mrkdwn', text: `*Execution Pulse:*\n\`${hostTimestamp}\`` }
          ]
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: '*Operational Status:*\n🟢 Active & Healthy' },
            { type: 'mrkdwn', text: '*AI Engine:*\n⚡ Groq (Llama 3.3)' }
          ]
        }
      ]
    });
  } catch (err) {
    console.error("Direct Slash command execution intercept failed:", err);
  }
});

app.post('/slack/events', slackRawBodyParser, async (req: any, res: any) => {
  const receiver = (slackApp as any).receiver;
  if (receiver && typeof receiver.handle === 'function') {
    try {
      await receiver.handle(req, res);
      return;
    } catch (err) {
      console.error("[Index Direct Slack Core Failure]:", err);
      return res.status(500).send();
    }
  }
  return res.status(404).send('Slack receiver not found');
});

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

app.get('/api/dashboard/analytics', async (req, res) => {
  try {
    const allTasks = await TaskModel.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, metrics: { totalTasks: allTasks.length }, tasks: allTasks });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
});

const startServer = async () => {
  await connectDatabase();
  const port = Number(process.env.PORT) || 5000;

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 [Server Boot] Core System online on explicit interface 0.0.0.0:${port}`);
  });
};

startServer().catch((err) => console.error(err));