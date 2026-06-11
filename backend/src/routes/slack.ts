import { slackApp } from '../config/slack.js';
import { GroqService } from '../services/groq.js';

const groqService = new GroqService();

// 1. /vibecheck Slash Command (Clean Structural Diagnostic Layout)
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

// 2. App Mentions Trigger Workflow (Clean Message Blocks Replacement)
slackApp.event('app_mention', async ({ event, client }) => {
  if (!event.user) return;
  const cleanMessage = event.text.replace(/<@.*?>/, '').trim();

  let loaderMessageTs = "";
  try {
    // Initial Post using explicit clean block layout
    const loaderResult = await client.chat.postMessage({
      channel: event.channel,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `⏳ *VibeCheck-Bot is thinking...*\n• _Interpreting workspace mention loops..._`
          }
        }
      ]
    });

    loaderMessageTs = loaderResult.ts || "";

    const reply = await groqService.getChatResponse(event.user, cleanMessage, event.channel);

    // Dynamic clean structural rewrite
    if (loaderMessageTs) {
      await client.chat.update({
        channel: event.channel,
        ts: loaderMessageTs,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Hello <@${event.user}>! \n\n${reply.trim()}`
            }
          }
        ]
      });
    }
  } catch (error: any) {
    console.error('[Runtime Exception] Application mention stack error:', error);
    if (loaderMessageTs) {
      const isRateLimit = error?.message?.includes('429') || JSON.stringify(error).includes('rate_limit');
      await client.chat.update({
        channel: event.channel,
        ts: loaderMessageTs,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: isRateLimit
                ? `⚠️ *VibeCheck System Alert:* AI Traffic Engine limits hit (Groq 429 Rate Limit). Please try again after a few minutes.`
                : `⚠️ *VibeCheck System Alert:* Connection timeout. Please try resending your message.`
            }
          }
        ]
      });
    }
  }
});

slackApp.message(async ({ message, client }) => {
  if (!('text' in message && message.text && !message.subtype)) return;
  if (!message.user) return;

  const channelId = message.channel;
  let loaderMessageTs = "";

  try {
    const loaderResult = await client.chat.postMessage({
      channel: channelId,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `⏳ *VibeCheck-Bot is thinking...*\n• _Establishing local communication node connections..._`
          }
        }
      ]
    });

    loaderMessageTs = loaderResult.ts || "";

    const reply = await groqService.getChatResponse(message.user, message.text.trim(), channelId);

    if (loaderMessageTs) {
      await client.chat.update({
        channel: channelId,
        ts: loaderMessageTs,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: reply.trim()
            }
          }
        ]
      });
    }
  } catch (error: any) {
    console.error('[Runtime Exception] Direct Message stack error:', error);
    if (loaderMessageTs) {
      const isRateLimit = error?.message?.includes('429') || JSON.stringify(error).includes('rate_limit');
      await client.chat.update({
        channel: channelId,
        ts: loaderMessageTs,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: isRateLimit
                ? `⚠️ *VibeCheck System Alert:* AI Engine processing capacity exhausted (Groq 429 Rate Limit). Trying to recover...`
                : `⚠️ *VibeCheck System Alert:* Local node communication interrupted. Please check back shortly.`
            }
          }
        ]
      });
    }
  }
});