import { Groq } from 'groq-sdk';
import { ChatMessage, ConversationMemory } from '../types/index.js';
import { SearchService } from './search.js';
import { TaskService } from './task.js';
import { UserProfile } from '../models/UserProfile.js'; 

export class GroqService {
  private groq: Groq;
  private searchService: SearchService;
  private taskService: TaskService;
  private memory: ConversationMemory = {};
  private readonly MAX_HISTORY = 6;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY as string,
    });
    this.searchService = new SearchService();
    this.taskService = new TaskService();
  }

  private getSystemMetrics(): string {
    return JSON.stringify({
      status: 'OPERATIONAL',
      environment: 'production',
      timestamp: new Date().toISOString(),
      latency: 'optimal'
    });
  }

  private extractNameFromText(text: string): string | null {
    const patterns = [
      /my name is\s+([a-zA-Z]+)/i,
      /mera naam\s+([a-zA-Z]+)/i,
      /i am\s+([a-zA-Z]+)/i,
      /call me\s+([a-zA-Z]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  public async getChatResponse(userId: string, userMessage: string, channelId: string = "direct_message"): Promise<string> {
    try {
      const detectedName = this.extractNameFromText(userMessage);
      let profile = await UserProfile.findOne({ slackUserId: userId });

      if (!profile) {
        profile = await UserProfile.create({ slackUserId: userId, name: detectedName || '' });
      } else if (detectedName) {
        profile.name = detectedName;
        await profile.save();
      }

      const userIdentityContext = profile.name
        ? `User Identity Context: The Slack user you are actively communicating with is named "${profile.name}". Always address them directly by their name.`
        : `User Identity Context: You do not know the user's name yet. If they state it, remember it naturally via systemic pipelines.`;

      if (!this.memory[userId]) {
        this.memory[userId] = [
          {
            role: 'system',
            content: `You are an advanced corporate AI Orchestrator Agent inside Slack driven by Llama 3.3. 
            Your context: Current User ID is ${userId} and Current Channel ID is ${channelId}.
            ${userIdentityContext}
            You have autonomous access to workspace tools. 
            1. If asked about system health/metrics, invoke getSystemMetrics.
            2. If asked about real-time web facts, versions, or global trends, invoke executeInternetSearch.
            3. If a user tells you to assign, log, or create a task/todo, autonomously call createTask. Always try to extract the user mention ID (like U12345). If no user is mentioned, default assign it to the current user ${userId}.
            4. If asked about pending tasks, list, or schedule registry, invoke getWorkspaceTasks.
            5. If a user tells you to mark a task as completed, finish it, or change status, extract the task ID string and call updateTaskStatus with status 'COMPLETED'.`,
          },
        ];
      } if (this.memory[userId] && this.memory[userId][0]) {
        this.memory[userId][0].content = `You are an advanced corporate AI Orchestrator Agent inside Slack driven by Llama 3.3. 
        Your context: Current User ID is ${userId} and Current Channel ID is ${channelId}.
        ${userIdentityContext}
        You have autonomous access to workspace tools. 
        1. If asked about system health/metrics, invoke getSystemMetrics.
        2. If asked about real-time web facts, versions, or global trends, invoke executeInternetSearch.
        3. If a user tells you to assign, log, or create a task/todo, autonomously call createTask. Always try to extract the user mention ID (like U12345). If no user is mentioned, default assign it to the current user ${userId}.
        4. If asked about pending tasks, list, or schedule registry, invoke getWorkspaceTasks.
        5. If a user tells you to mark a task as completed, finish it, or change status, extract the task ID string and call updateTaskStatus with status 'COMPLETED'.`;
      }

      const userHistory = this.memory[userId];
      userHistory.push({ role: 'user', content: userMessage });

      const tools = [
        {
          type: 'function' as const,
          function: {
            name: 'getSystemMetrics',
            description: 'Fetches current system performance telemetry status logs.',
            parameters: { type: 'object', properties: {} },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'executeInternetSearch',
            description: 'Searches the live web environment using Tavily for recent real-time documentations and news.',
            parameters: {
              type: 'object',
              properties: { query: { type: 'string', description: 'The search criteria string.' } },
              required: ['query'],
            },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'createTask',
            description: 'Creates and commits a new task into the workspace MongoDB database.',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'The explicit description of the assignment action items.' },
                assignedTo: { type: 'string', description: 'The Slack User ID string (e.g., U123AB). Extract from syntax.' },
                dueDate: { type: 'string', description: 'Optional ISO date string representation or format YYYY-MM-DD.' }
              },
              required: ['title', 'assignedTo'],
            },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'getWorkspaceTasks',
            description: 'Queries the database layer to fetch active registries or todos filtering this team ecosystem.',
            parameters: {
              type: 'object',
              properties: {
                targetUser: { type: 'string', description: 'Optional specific target Slack user identifier to query logs for.' }
              }
            },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'updateTaskStatus',
            description: 'Updates an existing task status field inside the remote MongoDB cluster.',
            parameters: {
              type: 'object',
              properties: {
                taskId: { type: 'string', description: 'The structural database object ID string.' },
                status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], description: 'The target state mutation.' }
              },
              required: ['taskId', 'status'],
            },
          },
        },
      ];

      let response = await this.groq.chat.completions.create({
        messages: userHistory as any[],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 700,
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

          let args: any = {};
          try {
            if (toolCall.function.arguments) {
              args = JSON.parse(toolCall.function.arguments);
            }
          } catch (e) {
            console.warn('[Orchestrator Warning] Argument tracing structure payload format unresolvable.');
          }

          if (toolCall.function.name === 'getSystemMetrics') {
            toolResult = this.getSystemMetrics();
          } else if (toolCall.function.name === 'executeInternetSearch') {
            toolResult = await this.searchService.executeSearch(args.query || '');
          } else if (toolCall.function.name === 'createTask') {
            toolResult = await this.taskService.createTask(args.title || 'Untitled Task', args.assignedTo || userId, userId, channelId, args.dueDate);
          } else if (toolCall.function.name === 'getWorkspaceTasks') {
            toolResult = await this.taskService.getChannelTasks(channelId, args ? args.targetUser : undefined);
          } else if (toolCall.function.name === 'updateTaskStatus') {
            toolResult = await this.taskService.updateTaskStatus(args.taskId, args.status);
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
      console.error(`[Agent Core Failure]:`, error);
      return 'The agent gateway encountered an error executing database tool pipelines.';
    }
  }

  private pruneContextHistory(userId: string): void {
    const history = this.memory[userId];
    if (history && history.length > this.MAX_HISTORY) {
      const rootPrompt = history[0];
      if (rootPrompt) {
        this.memory[userId] = [rootPrompt, ...history.slice(-this.MAX_HISTORY)];
      }
    }
  }
}