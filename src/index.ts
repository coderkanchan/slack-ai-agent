import { App } from '@slack/bolt';
import dotenv from 'dotenv';

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN as string,
  appToken: process.env.SLACK_APP_TOKEN as string,
  socketMode: true,
});

app.event('app_mention', async ({ event, say }) => {
  try {
    await say(`Hello <@${event.user}>! 👋 Maine aapka message receive kar liya hai. Jaldi hi hum yahan Groq AI integrate karenge!`);
  } catch (error) {
    console.error('Event handle karne mein error aaya:', error);
  }
});
// Jab koi direct bot ko personal chat (DM) mein message bheje
app.message(async ({ message, say }) => {
  try {
    // Check karna ki message normal text hai ya nahi
    if ('text' in message && message.text) {
      const userMessage = message.text.trim();

      // Groq AI ko call karna
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful, smart AI Assistant inside a Slack DM.' },
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.3-70b-specdec',
      });

      const aiResponse = chatCompletion.choices[0]?.message?.content || "Sorry, samajh nahi paya.";
      await say(aiResponse);
    }
  } catch (error) {
    console.error('DM handle karne mein error aaya:', error);
  }
});
(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log('⚡ Slack AI Agent server start ho gaya hai!');
})();