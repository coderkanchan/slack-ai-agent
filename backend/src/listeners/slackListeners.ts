import { App } from '@slack/bolt';
import { GroqService } from '../services/groq.js';
import logger from '../utils/logger.js';
import { broadcastDashboardUpdates } from '../utils/telemetry.js';

interface SlackMessageEvent {
  type: string;
  text?: string;
  channel: string;
  ts?: string;
  subtype?: string;
  user?: string;
}

export const registerSlackListeners = (slackApp: App): void => {
  const aiOrchestrator = new GroqService();

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
      await broadcastDashboardUpdates();
    } catch (error) {
      logger.error({ error, context: 'Slack Listeners' }, '[Slack Listeners] Error inside /ask-ai command:');
    }
  });

  slackApp.command('/vibecheck', async ({ command, ack, respond }: any) => {
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
      logger.error({ error, context: 'Slack Listeners' }, '[Slack Listeners] /vibecheck failed execution:');
    }
  });

  slackApp.event('app_mention', async ({ event, client, ack }: any) => {
    if (ack) await ack();
    if (!event.user) return;
    const cleanMessage = event.text.replace(/<@.*?>/, '').trim();

    let loaderMessageTs = "";
    try {
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
      const reply = await aiOrchestrator.getChatResponse(event.user, cleanMessage, event.channel);

      if (loaderMessageTs) {
        const textOutput = typeof reply === 'string' ? reply : (reply.text || '');
        const sanitizedOutput = textOutput.replace(/^getting,\s*/i, '');

        await client.chat.update({
          channel: event.channel,
          ts: loaderMessageTs,
          text: `Hello <@${event.user}>! \n\n${sanitizedOutput.trim()}`,
          blocks: reply.blocks
        });
        await broadcastDashboardUpdates();
      }
    } catch (error: any) {
      logger.error({ error, context: 'Slack Listeners' }, '[Slack Listeners] app_mention exception:');
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

  slackApp.message(async ({ message, client, ack }: any) => {
    if (ack) await ack();
    const msgEvent = message as SlackMessageEvent;
    if (msgEvent.subtype && msgEvent.subtype === 'bot_message') return;
    if (!msgEvent.text || msgEvent.text.trim() === '' || !msgEvent.user) return;

    const channelId = msgEvent.channel;
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
      const aiResponsePayload = await aiOrchestrator.getChatResponse(msgEvent.user, msgEvent.text.trim(), channelId);

      if (loaderMessageTs) {
        const textOutput = typeof aiResponsePayload === 'string' ? aiResponsePayload : (aiResponsePayload.text || '');
        const sanitizedOutput = textOutput.replace(/^getting,\s*/i, '');

        await client.chat.update({
          channel: channelId,
          ts: loaderMessageTs,
          text: sanitizedOutput.trim(),
          blocks: aiResponsePayload.blocks
        });
        await broadcastDashboardUpdates();
      }
    } catch (error: any) {
      logger.error({ error, context: 'Slack Listeners' }, '[Slack Listeners] Direct Message processing exception:');
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
};