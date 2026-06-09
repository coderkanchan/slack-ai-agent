import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in environment variables!");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateAIResponse = async (prompt: string): Promise<string> => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful, brilliant, and professional AI Assistant inside a Slack workspace. Keep your answers concise, informative, and formatted cleanly using Slack markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0.7,
    });

    return chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("🚀 Groq API Execution Error:", error);
    throw error;
  }
};