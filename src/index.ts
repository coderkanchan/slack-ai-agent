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

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log('⚡ Slack AI Agent server start ho gaya hai!');
})();