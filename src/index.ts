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

async function generateAIResponse(userMessage: string, context: string): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a professional, smart, and helpful AI Assistant inside Slack. Context: ${context}. Respond clearly and concisely.`
      },
      { role: 'user', content: userMessage }
    ],
    model: 'llama-3.3-70b-versatile',
  });

  return chatCompletion.choices[0]?.message?.content || "I'm sorry, I could not process that request.";
}

app.event('app_mention', async ({ event, say }) => {
  try {
    const userMessage = event.text.replace(/<@.*?>/, '').trim(); 
    const aiResponse = await generateAIResponse(userMessage, "Channel Mention");
    await say(`Hello <@${event.user}>! ${aiResponse}`);
  } catch (error) {
    console.error('Error handling app_mention event:', error);
  }
});

app.message(async ({ message, say }) => {
  try {
    if ('text' in message && message.text) {
      const userMessage = message.text.trim();
      const aiResponse = await generateAIResponse(userMessage, "Direct Message");
      await say(aiResponse);
    }
  } catch (error) {
    console.error('Error handling message event:', error);
  }
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log('⚡ Slack AI Agent server is running successfully!');
})();