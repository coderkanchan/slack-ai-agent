import { Groq } from 'groq-sdk';
import { ChatMessage, ConversationMemory } from '../types/index.js';
import { SearchService } from './search.js';

export class GroqService {
  private groq: Groq;
  private searchService: SearchService;
  private memory: ConversationMemory = {};
  private readonly MAX_HISTORY = 12;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY as string,
    });
    this.searchService = new SearchService();
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
          content: 'You are an advanced corporate AI Orchestrator Agent inside Slack. You have autonomous access to engineering tools. If a user asks about system operational details, use getSystemMetrics. If a user asks about latest news, codes, error documentation, versions, or external web facts, autonomously invoke executeInternetSearch to fetch live ground truth data before answering.',
        },
      ];
    }

    const userHistory = this.memory[userId];
    userHistory.push({ role: 'user', content: userMessage });

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'getSystemMetrics',
          description: 'Fetches current real-time system metrics, operational timestamps, and environment state.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'executeInternetSearch',
          description: 'Searches the live internet in real-time to fetch recent tech documentation, patches, versions, news, or global knowledge answers.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query string optimized for lookup.',
              },
            },
            required: ['query'],
          },
        },
      },
    ];

    try {
      let response = await this.groq.chat.completions.create({
        messages: userHistory as any[],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 600,
        tools: tools as any[],
        tool_choice: 'auto',
      });

      let responseMessage = response.choices[0]?.message;
      if (!responseMessage) return 'An orchestration exception occurred.';

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        userHistory.push({
          role: 'assistant',
          content: responseMessage.content || '',
          tool_calls: responseMessage.tool_calls
        });

        for (const toolCall of responseMessage.tool_calls) {
          let toolResult = '';

          if (toolCall.function.name === 'getSystemMetrics') {
            toolResult = this.getSystemMetrics();
          } else if (toolCall.function.name === 'executeInternetSearch') {
            const args = JSON.parse(toolCall.function.arguments);
            toolResult = await this.searchService.executeSearch(args.query);
          }

          userHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: toolResult,
          });
        }

        const secondResponse = await this.groq.chat.completions.create({
          messages: userHistory as any[],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
        });

        const finalReply = secondResponse.choices[0]?.message?.content || 'Execution failed to compute tool telemetry.';
        userHistory.push({ role: 'assistant', content: finalReply });
        this.pruneContextHistory(userId);
        return finalReply;
      }

      const standardReply = responseMessage.content || 'Unable to process communication trace.';
      userHistory.push({ role: 'assistant', content: standardReply });
      this.pruneContextHistory(userId);
      return standardReply;

    } catch (error) {
      console.error(`[Agent Multi-Tool Error] Tracing failed for client ${userId}:`, error);
      return 'The agent gateway encountered an error executing multiple tool pipelines.';
    }
  }

  private pruneContextHistory(userId: string): void {
    const history = this.memory[userId];
    if (history && history.length > this.MAX_HISTORY) {
      const rootPrompt = history[0] || { role: 'system', content: 'You are an advanced AI orchestrator.' };
      this.memory[userId] = [rootPrompt, ...history.slice(-this.MAX_HISTORY)];
    }
  }
}