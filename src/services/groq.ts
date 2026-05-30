import { Groq } from 'groq-sdk';
import { ChatMessage, ConversationMemory } from '../types/index.js';

export class GroqService {
  private groq: Groq;
  private memory: ConversationMemory = {};
  private readonly MAX_HISTORY = 12;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY as string,
    });
  }

  private getSystemMetrics(): string {
    const currentDateTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium'
    });
    return JSON.stringify({
      status: 'OPERATIONAL',
      environment: 'production',
      timestamp: currentDateTime,
      timezone: 'Asia/Kolkata',
      latency: 'optimal'
    });
  }

  public async getChatResponse(userId: string, userMessage: string): Promise<string> {
    if (!this.memory[userId]) {
      this.memory[userId] = [
        {
          role: 'system',
          content: 'You are an advanced, high-performance AI workplace agent built natively into Slack. Do not simulate metadata or provide generic fallback answers for date/time or workspace states. Instead, always execute the relevant registered tool to obtain accurate, real-time environment metrics when requested.',
        },
      ];
    }

    const userHistory = this.memory[userId];
    userHistory.push({ role: 'user', content: userMessage });

    const tools: Groq.Chat.CompletionCreateParams.Tool[] = [
      {
        type: 'function',
        function: {
          name: 'getSystemMetrics',
          description: 'Fetches current real-time system metrics, environment state, exact standard local date, and operational timestamps from the host backend.',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
    ];

    try {
      let response = await this.groq.chat.completions.create({
        messages: userHistory as Groq.Chat.ChatCompletionMessageParam[],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 512,
        tools: tools,
        tool_choice: 'auto',
      });

      let responseMessage = response.choices[0]?.message;

      if (!responseMessage) {
        return 'An orchestration exception occurred.';
      }

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        userHistory.push({
          role: 'assistant',
          content: responseMessage.content || '',
          tool_calls: responseMessage.tool_calls
        });

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'getSystemMetrics') {
            const toolResult = this.getSystemMetrics();

            userHistory.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: toolResult,
            });
          }
        }

        const secondResponse = await this.groq.chat.completions.create({
          messages: userHistory as Groq.Chat.ChatCompletionMessageParam[],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.4,
        });

        const finalReply = secondResponse.choices[0]?.message?.content || 'Execution failed to compute.';
        userHistory.push({ role: 'assistant', content: finalReply });
        this.pruneContextHistory(userId);
        return finalReply;
      }

      const standardReply = responseMessage.content || 'Unable to process communication trace.';
      userHistory.push({ role: 'assistant', content: standardReply });
      this.pruneContextHistory(userId);
      return standardReply;

    } catch (error) {
      console.error(`[Agent Core Error] Autonomous execution tracing failed for client ${userId}:`, error);
      return 'The agent gateway encountered an engineering exception processing this trace.';
    }
  }

  private pruneContextHistory(userId: string): void {
    const history = this.memory[userId];
    if (history && history.length > this.MAX_HISTORY) {
      const rootPrompt = history[0] || { role: 'system', content: 'You are an advanced AI workplace agent.' };
      this.memory[userId] = [
        rootPrompt,
        ...history.slice(-this.MAX_HISTORY),
      ];
    }
  }
}