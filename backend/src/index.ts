import { App } from '@slack/bolt';
import { GroqService } from './services/groq.js';
import { connectDatabase } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
  throw new Error('CRITICAL: Missing essential Slack configuration tokens in environment variables.');
}

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const aiOrchestrator = new GroqService();

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

  (async (): Promise<void> => {
    const userPrompt: string = command.text.trim();
    const channelId: string = command.channel_id;
    const userId: string = command.user_id;

    if (!userPrompt) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: '⚠️ *Invalid Usage:* Please provide a valid prompt. \n_Example:_ `/ask-ai Explain asynchronous code execution flow.`',
      });
      return;
    }

    let loadingMessageTs = '';

    try {
      const loaderResult = await client.chat.postMessage({
        channel: channelId,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⏳ *VibeCheck-Bot is processing...*\n• _Executing workflow query: "${userPrompt}"_\n• _Routing through autonomous Llama 3.3 pipeline..._`,
            },
          },
        ],
      });

      loadingMessageTs = loaderResult.ts || '';

      const aiResult = await aiOrchestrator.getChatResponse(userId, userPrompt, channelId);

      if (loadingMessageTs) {
        await client.chat.update({
          channel: channelId,
          ts: loadingMessageTs,
          text: aiResult.text, 
          blocks: aiResult.blocks 
        });
      }
    } catch (error) {
      console.error('[CRITICAL FAILURE] Error inside /ask-ai execution stream:', error);

      if (loadingMessageTs) {
        await client.chat.update({
          channel: channelId,
          ts: loadingMessageTs,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '❌ *System Error:* An unhandled exception occurred while computing tool calling workflows.',
              },
            },
          ],
        });
      }
    }
  })();
});

slackApp.message(async ({ message, client }: any) => {
  const msgEvent = message as SlackMessageEvent;

  if (msgEvent.subtype && msgEvent.subtype === 'bot_message') {
    return;
  }

  const rawMessageText: string | undefined = msgEvent.text;
  const channelId: string = msgEvent.channel;
  const userId: string = msgEvent.user || '';

  if (!rawMessageText || rawMessageText.trim() === '' || !userId) {
    return;
  }

  const cleanedMessageText: string = rawMessageText.trim();
  let textMessageTs = '';

  try {
    const responseTracker = await client.chat.postMessage({
      channel: channelId,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⏳ *VibeCheck-Bot is analyzing text...*\n• _Parsing semantic tokens: "${cleanedMessageText}"_\n• _Checking workflow triggers..._`,
          },
        },
      ],
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
    console.error('[CRITICAL FAILURE] Error inside text message event middleware:', error);

    if (textMessageTs) {
      await client.chat.update({
        channel: channelId,
        ts: textMessageTs,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '❌ *Timeout Error:* Failed to establish runtime handshakes with remote database nodes.',
            },
          },
        ],
      });
    }
  }
});

(async () => {
  const runtimePort: number = Number(process.env.PORT) || 5000;
  try {
    await connectDatabase();
    await slackApp.start(runtimePort);
    console.log(`⚡️ Professional VibeCheck Engine is actively running on production port: ${runtimePort}`);
  } catch (initError) {
    console.error('Fatal initialization error during Bolt runtime bootstrap:', initError);
    process.exit(1);
  }
})();