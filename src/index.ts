import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN as string,
  appToken: process.env.SLACK_APP_TOKEN as string,
  socketMode: true,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY as string,
});

app.event('app_mention', async ({ event, say }) => {
  try {
    await say(`Hello <@${event.user}>! 👋 Maine aapka message receive kar liya hai. Jaldi hi hum yahan Groq AI integrate karenge!`);
  } catch (error) {
    console.error('Event handle karne mein error aaya:', error);
  }
});

app.message(async ({ message, say }) => {
  try {
    if ('text' in message && message.text) {
      const userMessage = message.text.trim();

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