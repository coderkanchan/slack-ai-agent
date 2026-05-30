import { slackApp } from './config/slack.js';
import { GroqService } from './services/groq.js';

const groqService = new GroqService();

slackApp.event('app_mention', async ({ event, say }) => {
  try {
    const cleanMessage = event.text.replace(/<@.*?>/, '').trim();
    const reply = await groqService.getChatResponse(event.user, cleanMessage, 'channel');
    await say(`Hello <@${event.user}>! ${reply}`);
  } catch (error) {
    console.error('[Runtime Error] app_mention exception:', error);
  }
});

slackApp.message(async ({ message, say }) => {
  try {
    if ('text' in message && message.text && !message.subtype) {
      const reply = await groqService.getChatResponse(message.user, message.text.trim(), 'dm');
      await say(reply);
    }
  } catch (error) {
    console.error('[Runtime Error] message event exception:', error);
  }
});

(async () => {
  const port = process.env.PORT || 3000;
  await slackApp.start(port);
  console.log(`[Processor] Slack Agent runtime initialized on port ${port}`);
})();