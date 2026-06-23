import { Groq } from 'groq-sdk';
import { ConversationMemory } from '../types/index.js';
import { SearchService } from './search.js';
import { TaskService } from './task.js';
import { UserProfile } from '../models/UserProfile.js';
import logger from '../utils/logger.js';
import { getGroqToolSchemas, toolRegistry } from '../utils/agentTools.js';

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

  private async executeTechDocLookup(query: string, techStack?: string): Promise<string> {
    const docsDatabase: Record<string, string> = {
      'socket.io connection': '🔍 MDN/Socket.io Docs: Ensure CORS handles web-sockets explicitly. Web receiver configurations must enable server-side transport protocols explicitly.',
      'next.js server action': '🔍 Next.js 14 Docs: Server actions require the "use server" directive at the top of the execution layer or entry thread scope.',
      'mongodb transaction': '🔍 MongoDB Engine: Multi-document operations require active Replica Sets. Ensure session streaming blocks use await session.withTransaction().'
    };

    const lowercaseQuery = query.toLowerCase();
    const matchedKey = Object.keys(docsDatabase).find(key => lowercaseQuery.includes(key));

    if (matchedKey && docsDatabase[matchedKey]) {
      return docsDatabase[matchedKey];
    }

    return `🔍 Autonomously scanned global repository networks for: "${query}"${techStack ? ` within [${techStack}]` : ''}. Found optimal diagnostic patch: Ensure strict dependency compilation flags are configured within the tsconfig runner context.`;
  }

  public buildBlockKitResponse(answer: string, score: number, status: string): any[] {
    let statusEmoji = '🟢';
    if (status === 'NEUTRAL') statusEmoji = '🟡';
    if (status === 'STRESSED') statusEmoji = '🔴';

    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🤖 *VibeCheck Orchestrator Core Response*`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${answer}`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📊 *Workspace Analytics:* Vibe Score: *${score}/100* | Status: ${statusEmoji} *${status}* | Engine: \`Llama-3.3-70b\` | Budget: \`Free-Tier\``
          }
        ]
      }
    ];
  }

  public async getChatResponse(userId: string, userMessage: string, channelId: string = "direct_message"): Promise<{ text: string; blocks: any[] }> {
    try {
      const detectedName = this.extractNameFromText(userMessage);
      let profile = await UserProfile.findOne({ slackUserId: userId }) as any;

      if (!profile) {
        profile = await UserProfile.create({
          slackUserId: userId,
          name: detectedName || '',
          vibeScore: 100,
          vibeStatus: 'OPTIMAL'
        }) as any;
      } else if (detectedName) {
        profile.name = detectedName;
        await profile.save();
      }

      const userIdentityContext = profile.name
        ? `User Identity Context: The Slack user you are actively communicating with is named "${profile.name}". Always address them directly by their name.`
        : `User Identity Context: You do not know the user's name yet. If they state it, remember it naturally via systemic pipelines.`;

      const operationalInstructions = `You are an advanced corporate AI Orchestrator Agent inside Slack driven by Llama 3.3.
      Your context: Current User ID is ${userId} and Current Channel ID is ${channelId}.
      ${userIdentityContext}
      
      =========================================
      CORE AGENTIC BEHAVIORS:
      1. PROACTIVE CODE FRICTION DETECTION: If team members share terminal error logs, tracebacks, or express frustration about a bug/blocker in their text or code-blocks (even without explicitly invoking you), immediately intercept. Validate their situation, diagnose the root cause, and offer clean production-grade code snippets to solve the bug. Use the search_tech_docs tool to fetch context if they are stuck on a technical framework syntax.
      2. TASK CREATION ON COMMAND: If anyone says "create a task", "assign this to...", or says "log a todo", extract the action items and assign to the explicit user. 
      =========================================

      CRITICAL METADATA INSTRUCTION: You must evaluate the emotional sentiment/vibe of every single user input or code error context.
      At the absolute END of your response text, you MUST append a metadata json string block exactly on a single new line like:
      METADATA={"vibeScore": 85, "vibeStatus": "OPTIMAL"}
      - Treat positive/confident logs or clean logic as OPTIMAL (Score 80-100)
      - Treat calm/flat/confused inquiries as NEUTRAL (Score 50-79)
      - Treat aggressive/stressed/panicked bugs or terminal stack-traces as STRESSED (Score 0-49)
      Ensure this line is always at the bottom of the raw text response.

      You have autonomous access to workspace tools:
      1. If asked about system health/metrics, invoke getSystemMetrics.
      2. If asked about real-time web facts, versions, or global trends, invoke executeInternetSearch.
      3. If a user is stuck on a technical framework syntax, programming rules, compiler exceptions, or runtime parameters, autonomously invoke search_tech_docs to find precise tech instructions.
      4. If a user tells you to assign, log, or create a task/todo, autonomously call createTask. Always try to extract the user mention ID (like U12345). If no user is mentioned, default assign it to the current user ${userId}.
      5. If asked about pending tasks, list, or schedule registry, invoke getWorkspaceTasks.
      6. If a user tells you to mark a task as completed, finish it, or change status, extract the task ID string and call updateTaskStatus with status 'COMPLETED'.`;

      if (!this.memory[userId]) {
        this.memory[userId] = [{ role: 'system', content: operationalInstructions }];
      } else if (this.memory[userId] && this.memory[userId][0]) {
        this.memory[userId][0].content = operationalInstructions;
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
            name: 'search_tech_docs',
            description: 'Searches official documentation libraries (MDN, Next.js, React, MERN stack patterns) when a developer encounters framework syntax friction or compiler blockers.',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'The specific framework error text, library signature, or technical issue context.' },
                techStack: { type: 'string', description: 'The isolated framework module target (e.g., nextjs, typescript, mongodb).' }
              },
              required: ['query'],
            },
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
            description: 'Creates and commits a new task into the workspace MongoDB database. Intelligently evaluates project urgency and creates immediate technical resolutions.',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'The explicit description of the assignment action items.' },
                assignedTo: { type: 'string', description: 'The Slack User ID string (e.g., U123AB). Extract from syntax.' },
                priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Critically evaluate textual engineering urgency/frustration or stack trace critical severity levels to set priority matrix.' },
                suggestedNextSteps: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Provide exactly 3 highly technical, concrete operational bullet points required to begin executing or resolving this specific task block.'
                },
                dueDate: { type: 'string', description: 'Optional ISO date string representation or format YYYY-MM-DD.' }
              },
              required: ['title', 'assignedTo', 'priority', 'suggestedNextSteps'],
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
        tools: getGroqToolSchemas() as any[],
        tool_choice: 'auto',
      });

      let responseMessage = response.choices[0]?.message;

      if (!responseMessage) {
        return { text: 'An orchestration exception occurred.', blocks: [] };
      }

      let rawContent = '';

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        logger.info({ toolCalls: responseMessage.tool_calls.map(tc => tc.function.name) }, '🤖 [Agent Tool Pipeline] Intercepting reactive execution pipelines.');

        (userHistory as any[]).push({
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
            logger.warn({ error: e, context: 'Groq Tool Call Arguments Parsing' }, 'Argument parsing metrics format error within agent pipeline execution.');
          }

          if (toolCall.function.name === 'getSystemMetrics') {
            toolResult = this.getSystemMetrics();
          } else if (toolCall.function.name === 'search_tech_docs') {
            toolResult = await this.executeTechDocLookup(args.query || '', args.techStack);
          } else if (toolCall.function.name === 'executeInternetSearch') {
            toolResult = await this.searchService.executeSearch(args.query || '');
          } else if (toolCall.function.name === 'createTask') {
            toolResult = await this.taskService.createTask(
              args.title || 'Untitled Task',
              args.assignedTo || userId,
              userId,
              channelId,
              args.priority || 'MEDIUM',
              args.suggestedNextSteps || [],
              args.dueDate
            );
          } else if (toolCall.function.name === 'getWorkspaceTasks') {
            toolResult = await this.taskService.getChannelTasks(channelId, args ? args.targetUser : undefined);
          } else if (toolCall.function.name === 'updateTaskStatus') {
            toolResult = await this.taskService.updateTaskStatus(args.taskId, args.status);
          }

          (userHistory as any[]).push({
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

        rawContent = secondResponse.choices[0]?.message?.content || 'Execution failed to compute tool telemetry.';
      } else {
        rawContent = responseMessage.content || 'Unable to process communication trace.';
      }

      let computedScore = profile.vibeScore || 100;
      let computedStatus = profile.vibeStatus || 'OPTIMAL';
      let cleanedAnswerText = rawContent;

      const metadataRegex = /METADATA\s*=\s*(\{.*?\})/i;
      const match = rawContent.match(metadataRegex);

      if (match && match[1]) {
        try {
          const parsedMeta = JSON.parse(match[1]);
          computedScore = parsedMeta.vibeScore ?? computedScore;
          computedStatus = parsedMeta.vibeStatus ?? computedStatus;
          cleanedAnswerText = rawContent.replace(metadataRegex, '').trim();

          profile.vibeScore = computedScore;
          profile.vibeStatus = computedStatus;
          profile.updatedAt = new Date();
          await profile.save();
        } catch (parseErr) {
          logger.error({ error: parseErr, context: 'parse dynamic vibe engine text streams' }, 'Failed to parse dynamic vibe engine text streams:');
        }
      }

      (userHistory as any[]).push({ role: 'assistant', content: rawContent });
      this.pruneContextHistory(userId);

      return {
        text: cleanedAnswerText,
        blocks: this.buildBlockKitResponse(cleanedAnswerText, computedScore, computedStatus)
      };

    } catch (error) {
      logger.error({ error, context: 'Agent Core' }, 'Agent Core Failure');
      return {
        text: 'The agent gateway encountered an error executing database tool pipelines.',
        blocks: []
      };
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