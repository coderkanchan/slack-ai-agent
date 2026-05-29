import { App } from '@slack/bolt';
import dotenv from 'dotenv';

// .env file se variables load karne ke liye
dotenv.config();

// Slack App initialize karna
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true, // Hum websockets use kar rahe hain
});

// Jab bhi koi bot ko mention kare, yeh event trigger hoga
app.event('app_mention', async ({ event, say }) => {
  try {
    await say(`Hello <@${event.user}>! 👋 Maine aapka message receive kar liya hai. Jaldi hi hum yahan Groq AI integrate karenge!`);
  } catch (error) {
    console.error('Event handle karne mein error aaya:', error);
  }
});

// Server ko start karne ka function
(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log('⚡ Slack AI Agent server start ho gaya hai!');
})();