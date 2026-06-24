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

    (async () => {
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
    })();
  });

  slackApp.command('/vibecheck', async ({ command, ack, client }: any) => {
    await ack();
    const userPrompt: string = command.text.trim();
    const channelId: string = command.channel_id;
    const userId: string = command.user_id;

    const dynamicPrompt = userPrompt || "Provide a quick workspace health check vibe update and system check status.";

    (async () => {
      let loadingMessageTs = '';
      try {
        const loaderResult = await client.chat.postMessage({
          channel: channelId,
          text: '⏳ Analyzing system parameters and workspace vibes...'
        });
        loadingMessageTs = loaderResult.ts || '';

        const aiResult = await aiOrchestrator.getChatResponse(userId, dynamicPrompt, channelId);

        await client.chat.update({
          channel: channelId,
          ts: loadingMessageTs,
          text: aiResult.text ? aiResult.text.replace(/^getting,\s*/i, '') : '',
          blocks: aiResult.blocks
        });
        await broadcastDashboardUpdates();
      } catch (error) {
        logger.error({ error, context: 'Slack Listeners' }, '[Slack Listeners] /vibecheck failed execution:');
      }
    })();
  });

  slackApp.event('app_mention', async ({ event, client, ack }: any) => {
    if (ack) await ack();
    if (!event.user) return;
    const cleanMessage = event.text.replace(/<@.*?>/, '').trim();

    (async () => {
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
    })();
  });

  slackApp.message(async ({ message, client, ack }: any) => {
    if (ack) await ack();
    const msgEvent = message as SlackMessageEvent;

    if (msgEvent.subtype && msgEvent.subtype === 'bot_message') return;
    if ((msgEvent as any).bot_id) return;

    if (!msgEvent.text || msgEvent.text.trim() === '' || !msgEvent.user) return;

    const isRetry = (msgEvent as any).headers?.['X-Slack-Retry-Num'] || (msgEvent as any).retry_num;
    if (isRetry) {
      logger.info({ messageId: msgEvent.ts }, '🛑 [Slack Retry Guard] Safely dropping duplicate retry stream packet.');
      return;
    }

    const channelId = msgEvent.channel;
    const validUser: string = msgEvent.user;
    const validText: string = msgEvent.text.trim();
    const isDirectMessage = channelId.startsWith('D');

    if (!isDirectMessage) {
      try {
        if (validText.length < 8) return;
        const telemetryAnalysis = await aiOrchestrator.analyzePassiveMessage(validUser, validText);

        if (telemetryAnalysis.vibeScore <= 50 || telemetryAnalysis.vibeStatus === 'STRESSED') {
          const analyticsPayload = JSON.stringify({
            score: telemetryAnalysis.vibeScore,
            status: telemetryAnalysis.vibeStatus
          });
          await client.chat.postMessage({
            channel: channelId,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `🚨 *Autonomous VibeCheck Blocker Intervention*`
                }
              },
              {
                type: "actions",
                block_id: "analytics_toggle_block",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "🔽 Show Analytics Metrics",
                      emoji: true
                    },
                    style: "primary",
                    value: analyticsPayload,
                    action_id: "toggle_analytics_view"
                  }
                ],
              },
              // {
              //   type: "context",
              //   elements: [
              //     {
              //       type: "mrkdwn",
              //       text: `📊 *Workspace Analytics:* Dynamic sentiment analysis - Vibe Score: \`${telemetryAnalysis.vibeScore}/100\` | Status: *${telemetryAnalysis.vibeStatus}* | Engine: \`Llama-3.3-70b\` | Budget: \`Free-Tier\``
              //     }
              //   ]
              // },
              // {
              //   type: "section",
              //   text: {
              //     type: "mrkdwn",
              //     text: `👋 Hey team, I noticed some architectural road-blocks in this thread. Here is an autonomous recommendations patch:\n\n${telemetryAnalysis.adviceText}`
              //   }
              // },
              {
                type: "divider"
              }
            ]
          });
          await broadcastDashboardUpdates();
        }
      } catch (passiveErr) {
        logger.error({ passiveErr }, 'Error executing active passive evaluation listener channel loops');
      }
      return;
    }

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
      const aiResponsePayload = await aiOrchestrator.getChatResponse(validUser, validText, channelId);

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

  slackApp.action("toggle_analytics_view", async ({ ack, action, body, client }: any) => {
    await ack();
    try {
      const currentBlocks = body.message.blocks;
      const buttonValue = JSON.parse(action.value);
      const isExpanded = action.text.text.includes("Hide");

      if (!isExpanded) {
        const analyticsBlock = {
          type: "context",
          block_id: "dynamic_metrics_layer",
          elements: [
            {
              type: "mrkdwn",
              text: `📊 *Workspace Analytics:* Vibe Score: \`${buttonValue.score}/100\` | Status: *${buttonValue.status}* | Engine: \`Llama-3.3-70b\` | Budget: \`Free-Tier\``
            }
          ]
        };

        action.text.text = "🔼 Hide Analytics Metrics";
        action.style = undefined; 

        currentBlocks.splice(1, 0, analyticsBlock);
      } else {
        const blockIndex = currentBlocks.findIndex((b: any) => b.block_id === "dynamic_metrics_layer");
        if (blockIndex !== -1) {
          currentBlocks.splice(blockIndex, 1);
        }
        action.text.text = "🔽 Show Analytics Metrics";
        action.style = "primary";
      }

      await client.chat.update({
        channel: body.channel.id,
        ts: body.message.ts,
        blocks: currentBlocks
      });

    } catch (err) {
      logger.error({ err }, "Failed to handle interactive UI block toggle action streams");
    }
  });
};