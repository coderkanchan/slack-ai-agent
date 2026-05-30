import { Groq } from 'groq-sdk';
import { ChatMessage, ConversationMemory } from '../types/index.js';

export class GroqService {
  private groq: Groq;
  private memory: ConversationMemory = {};
  private readonly MAX_HISTORY = 10;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY as string,
    });
  }

  public async getChatResponse(userId: string, userMessage: string, channelType: string): Promise<string> {
    if (!this.memory[userId]) {
      this.memory[userId] = [
        {
          role: 'system',
          content: 'You are an advanced, professional AI workplace assistant integrated into Slack. Provide direct, objective, and context-aware responses suitable for corporate communications. Maintain absolute clarity.',
        },
      ];
    }

    const userHistory = this.memory[userId];
    userHistory.push({ role: 'user', content: userMessage });

    try {
      const response = await this.groq.chat.completions.create({
        messages: userHistory,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 512,
      });

      const assistantReply = response.choices[0]?.message?.content || 'Unable to process request.';

      userHistory.push({ role: 'assistant', content: assistantReply });

      if (userHistory.length > this.MAX_HISTORY) {
        const systemPrompt = userHistory[0] || {
          role: 'system',
          content: 'You are an advanced, professional AI workplace assistant integrated into Slack.'
        };
        this.memory[userId] = [
          systemPrompt,
          ...userHistory.slice(-this.MAX_HISTORY),
        ];
      }

      return assistantReply;
    } catch (error) {
      console.error(`[GroqService Error] Failed execution for user ${userId}:`, error);
      return 'An infrastructure error occurred while processing your request.';
    }
  }
}