import express from 'express';
import cors from 'cors';
import { slackApp } from './config/slack.js';
import { connectDatabase } from './config/db.js';
import { GroqService } from './services/groq.js';
import { TaskModel } from './models/Task.js';

const groqService = new GroqService();
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.post('/slack/events', express.json(), async (req: any, res: any, next) => {
  if (req.body && req.body.type === 'url_verification') {
    return res.status(200).send({ challenge: req.body.challenge });
  }

  try {
    const rawApp: any = slackApp;
    if (rawApp.receiver && typeof rawApp.receiver.handle === 'function') {
      await rawApp.receiver.handle(req, res);
      return;
    } else if (rawApp.receiver && rawApp.receiver.app && typeof rawApp.receiver.app === 'function') {
      await rawApp.receiver.app(req, res);
      return;
    } else if (rawApp.receiver && rawApp.receiver.router && typeof rawApp.receiver.router === 'function') {
      await rawApp.receiver.router(req, res);
      return;
    }
  } catch (err) {
    console.error("Slack receiver bridge mismatch error:", err);
  }

  next();
});

app.use(express.json());

app.get('/api/dashboard/analytics', async (req: any, res: any) => {
  try {
    const allTasks = await TaskModel.find({}).sort({ createdAt: -1 });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const pendingTasks = allTasks.filter((t: any) => t.status === 'PENDING').length;

    const activeVibeScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return res.status(200).json({
      success: true,
      metrics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        activeVibeScore
      },
      tasks: allTasks
    });
  } catch (error) {
    console.error('[Dashboard Endpoint Critical failure]:', error);
    return res.status(500).json({ success: false, error: 'Database stats extraction failed.' });
  }
});

const startServer = async () => {
  await connectDatabase();

  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`🚀 [Server Boot] VibeCheck Corporate Hub Core is live on port ${port}`);
  });
};

startServer().catch((err) => {
  console.error('[Critical App Core Crash]:', err);
});

slackApp.event('app_mention', async ({ event, client, say }) => {
  if (!event.user) return;
  const cleanMessage = event.text.replace(/<@.*?>/, '').trim();

  let loaderMessage;
  try {
    loaderMessage = await say(`⏳ *Thinking Steps:*\n🔍 _Interpreting workspace mention loops..._`);

    client.chat.update({
      channel: event.channel,
      ts: loaderMessage.ts as string,
      text: `⏳ *Thinking Steps:*\n🔍 _Reading database cluster configuration..._\n🧠 _Routing semantic matrices via Groq..._`
    }).catch(err => console.error("Non-blocking UI shift failed:", err));

    const reply = await groqService.getChatResponse(event.user, cleanMessage, event.channel);

    await client.chat.update({
      channel: event.channel,
      ts: loaderMessage.ts as string,
      text: `Hello <@${event.user}>! ${reply}`
    });

  } catch (error: any) {
    console.error('[Runtime Exception] Application mention stack error:', error);

    if (loaderMessage?.ts) {
      const isRateLimit = error?.message?.includes('429') || JSON.stringify(error).includes('rate_limit');
      await client.chat.update({
        channel: event.channel,
        ts: loaderMessage.ts as string,
        text: isRateLimit
          ? `⚠️ *VibeCheck System Alert:* AI Traffic Engine limits hit (Groq 429 Rate Limit). Please try again after a few minutes.`
          : `⚠️ *VibeCheck System Alert:* Connection timeout. Please try resending your message.`
      });
    }
  }
});

slackApp.message(async ({ message, client, say }) => {
  if (!('text' in message && message.text && !message.subtype)) return;
  if (!message.user) return;

  const channelId = message.channel;
  let loaderMessage;

  try {
    loaderMessage = await say(`⏳ *Thinking Steps:*\n🔍 _Establishing local communication node connections..._`);

    client.chat.update({
      channel: channelId,
      ts: loaderMessage.ts as string,
      text: `⏳ *Thinking Steps:*\n🔍 _Validating local node communication pipelines..._\n🧠 _Routing tool calling matrices via Groq..._`
    }).catch(err => console.error("Non-blocking UI shift failed:", err));

    const reply = await groqService.getChatResponse(message.user, message.text.trim(), channelId);

    await client.chat.update({
      channel: channelId,
      ts: loaderMessage.ts as string,
      text: reply
    });

  } catch (error: any) {
    console.error('[Runtime Exception] Direct Message stack error:', error);

    if (loaderMessage?.ts) {
      const isRateLimit = error?.message?.includes('429') || JSON.stringify(error).includes('rate_limit');
      await client.chat.update({
        channel: channelId,
        ts: loaderMessage.ts as string,
        text: isRateLimit
          ? `⚠️ *VibeCheck System Alert:* AI Engine processing capacity exhausted (Groq 429 Rate Limit). Trying to recover...`
          : `⚠️ *VibeCheck System Alert:* Local node communication interrupted. Please check back shortly.`
      });
    }
  }
});

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
          text: {
            type: 'plain_text',
            text: '📊 Workspace VibeCheck Diagnostic',
            emoji: true
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Requested By:*\n<@${command.user_id}>`
            },
            {
              type: 'mrkdwn',
              text: `*Execution Pulse:*\n\`${hostTimestamp}\``
            }
          ]
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '*Operational Status:*\n🟢 Active & Healthy'
            },
            {
              type: 'mrkdwn',
              text: '*AI Engine:*\n⚡ Groq (Llama 3.3)'
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'plain_text',
              text: 'VibeCheck-Bot Enterprise Node Engine • System Metrics Optimal',
              emoji: false
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('[Slash Command Error] /vibecheck failed execution:', error);
  }
});