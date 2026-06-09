import { Groq } from '@groq/groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in environment variables!");
}

// Groq Client Instance Initialization
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Helper function to generate AI responses using fast Llama models
 */
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
      model: 'llama3-8b-8192', 
      temperature: 0.7,
    });

    return chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("🚀 Groq API Execution Error:", error);
    throw error;
  }
};