import { App, SlackCommandMiddlewareArgs, SlackEventMiddlewareArgs, SayFn } from '@slack/bolt';
import { generateAIResponse } from './services/aiService'; 
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
  throw new Error('CRITICAL: Missing essential Slack configuration tokens in environment variables.');
}

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

interface SlackMessageEvent {
  type: string;
  text?: string;
  channel: string;
  ts?: string;
  subtype?: string;
  user?: string;
}

slackApp.command('/ask-ai', async ({ command, ack, client }: SlackCommandMiddlewareArgs) => {
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
              text: `⏳ *VibeCheck-Bot is thinking...*\n• _Processing workflow prompt: "${userPrompt}"_\n• _Querying remote Groq LLM layer..._`,
            },
          },
        ],
      });

      loadingMessageTs = loaderResult.ts || '';
      const aiAnswer: string = await generateAIResponse(userPrompt);

      if (loadingMessageTs) {
        await client.chat.update({
          channel: channelId,
          ts: loadingMessageTs,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🤖 *AI Agent Response to "${userPrompt}":*\n\n${aiAnswer.trim()}`,
              },
            },
          ],
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
                text: '❌ *System Error:* An unhandled exception occurred while processing the neural network layers.',
              },
            },
          ],
        });
      }
    }
  })();
});

slackApp.message(async ({ message, client }: SlackEventMiddlewareArgs<'message'>) => {
  const msgEvent = message as SlackMessageEvent;

  if (msgEvent.subtype && msgEvent.subtype === 'bot_message') {
    return;
  }

  const rawMessageText: string | undefined = msgEvent.text;
  const channelId: string = msgEvent.channel;

  if (!rawMessageText || rawMessageText.trim() === '') {
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
            text: `⏳ *VibeCheck-Bot is thinking...*\n• _Analyzing: "${cleanedMessageText}"_\n• _Fetching context data..._`,
          },
        },
      ],
    });

    textMessageTs = responseTracker.ts || '';

    const aiResponsePayload: string = await generateAIResponse(cleanedMessageText);

    if (textMessageTs) {
      await client.chat.update({
        channel: channelId,
        ts: textMessageTs,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🤖 *AI Agent Response to "${cleanedMessageText}":*\n\n${aiResponsePayload.trim()}`,
            },
          },
        ],
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
              text: '❌ *Timeout Error:* Failed to establish complete handshakes with the inference engine.',
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
    await slackApp.start(runtimePort);
    console.log(`⚡️ Professional VibeCheck Engine is actively running on production port: ${runtimePort}`);
  } catch (initError) {
    console.error('Fatal initialization error during Bolt runtime bootstrap:', initError);
    process.exit(1);
  }
})();