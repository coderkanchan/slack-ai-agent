import { Router } from 'express';
import { slackApp } from '../config/slack.js';
import { GroqService } from '../services/groq.js';

const router = Router();
const groqService = new GroqService();

// 1. Handling the main endpoint routing
router.post('/slack/events', async (req: any, res: any, next: any) => {
  const receiver = (slackApp as any).receiver;
  if (receiver && typeof receiver.handle === 'function') {
    try {
      await receiver.handle(req, res);
      return;
    } catch (err) {
      console.error("Slack event error:", err);
      return res.status(500).send();
    }
  }
  next();
});

// 2. Slack Listeners & Features
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
        },
        {
          type: 'context',
          elements: [
            { type: 'plain_text', text: 'VibeCheck-Bot Enterprise Node Engine • System Metrics Optimal', emoji: false }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('[Slash Command Error] /vibecheck failed execution:', error);
  }
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

// 3. Exporting at the very end
export { router as slackRouter };