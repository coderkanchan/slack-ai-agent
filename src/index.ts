import { slackApp } from './config/slack.js';
import { GroqService } from './services/groq.js';

const groqService = new GroqService();

slackApp.event('app_mention', async ({ event, say }) => {
  try {
    if (!event.user) return;
    const cleanMessage = event.text.replace(/<@.*?>/, '').trim();
    const reply = await groqService.getChatResponse(event.user, cleanMessage);
    await say(`Hello <@${event.user}>! ${reply}`);
  } catch (error) {
    console.error('[Runtime Exception] Application mention stack error:', error);
  }
});

slackApp.message(async ({ message, say }) => {
  try {
    if ('text' in message && message.text && !message.subtype) {
      if (!message.user) return;
      const reply = await groqService.getChatResponse(message.user, message.text.trim());
      await say(reply);
    }
  } catch (error) {
    console.error('[Runtime Exception] Direct Message stack error:', error);
  }
});

(async () => {
  const port = process.env.PORT || 3000;
  await slackApp.start(port);
  console.log(`[Processor] Micro-agent running successfully on port ${port}`);
})();