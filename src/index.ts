import { slackApp } from './config/slack.js';
import { connectDatabase } from './config/db.js';
import { GroqService } from './services/groq.js';

const groqService = new GroqService();

const startServer = async () => {
  await connectDatabase();

  const port = process.env.PORT || 3000;
  await slackApp.start(port);
  console.log(`🚀 [Server Boot] VibeCheck Corporate Hub Core is live on port ${port}`);
};

startServer().catch((err) => {
  console.error('[Critical App Core Crash]:', err);
});

slackApp.event('app_mention', async ({ event, client, say }) => {
  try {
    if (!event.user) return;
    const cleanMessage = event.text.replace(/<@.*?>/, '').trim();

    const loaderMessage = await client.chat.postMessage({
      channel: event.channel,
      text: `⏳ *Thinking Steps:*\n🔍 _Reading app workspace event context loops..._`
    });

    await client.chat.update({
      channel: event.channel,
      ts: loaderMessage.ts as string,
      text: `⏳ *Thinking Steps:*\n🔍 _Searching Database... Done._\n🧠 _Analyzing system queries via Groq (Llama 3.3)..._`
    });

    const reply = await groqService.getChatResponse(event.user, cleanMessage, event.channel);

    await client.chat.update({
      channel: event.channel,
      ts: loaderMessage.ts as string,
      text: `Hello <@${event.user}>! ${reply}`
    });

  } catch (error) {
    console.error('[Runtime Exception] Application mention stack error:', error);
  }
});

slackApp.message(async ({ message, client, say }) => {
  try {
    if ('text' in message && message.text && !message.subtype) {
      if (!message.user) return;

      const loaderMessage = await client.chat.postMessage({
        channel: message.channel,
        text: `⏳ *Thinking Steps:*\n🔍 _Validating local node communication pipelines..._`
      });

      await client.chat.update({
        channel: message.channel,
        ts: loaderMessage.ts as string,
        text: `⏳ *Thinking Steps:*\n🔍 _Interpreting semantic syntax blocks..._\n🧠 _Routing tool calling matrices via Groq..._`
      });

      const reply = await groqService.getChatResponse(message.user, message.text.trim(), message.channel);

      await client.chat.update({
        channel: message.channel,
        ts: loaderMessage.ts as string,
        text: reply
      });
    }
  } catch (error) {
    console.error('[Runtime Exception] Direct Message stack error:', error);
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