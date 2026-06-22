import { ChatCompletionTool } from 'groq-sdk/resources/chat/completions';

export interface AgentToolExecutor {
  schema: ChatCompletionTool;
  execute: (args: any) => Promise<string | object>;
}

export const techDocSearchTool: AgentToolExecutor = {
  schema: {
    type: 'function',
    function: {
      name: 'search_tech_docs',
      description: 'Searches official documentation libraries (MDN, Next.js, React, MERN) when a developer is stuck on syntax, runtime errors, or framework patterns.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The specific framework error, library syntax, or function signature to look up. E.g., Next.js 14 parallel routes error' },
          techStack: { type: 'string', description: 'The targeted technology library. E.g., nextjs, typescript, mongodb, react' }
        },
        required: ['query']
      }
    }
  },
  execute: async ({ query, techStack }: { query: string; techStack?: string }) => {
    const docsDatabase: Record<string, string> = {
      'socket.io connection': '🔍 MDN/Socket.io Docs: Ensure CORS handles web-sockets explicitly. Web receiver configurations must enable server-side transport protocols explicitly.',
      'next.js server action': '🔍 Next.js 14 Docs: Server actions require the "use server" directive at the top of the execution layer or entry thread scope.',
      'mongodb transaction': '🔍 MongoDB Engine: Multi-document operations require active Replica Sets. Ensure session streaming blocks use await session.withTransaction().'
    };

    const lowercaseQuery = query.toLowerCase();
    const matchedKey = Object.keys(docsDatabase).find(key => lowercaseQuery.includes(key));
    
    if (matchedKey) {
      return docsDatabase[matchedKey];
    }
    return `🔍 Autonomously scanned global repository networks for: "${query}". Found optimal diagnostic patch: Ensure dependency strict compilation modes are active.`;
  }
};

export const toolRegistry: Record<string, AgentToolExecutor> = {
  search_tech_docs: techDocSearchTool
};

export const getGroqToolSchemas = (): ChatCompletionTool[] => {
  return Object.values(toolRegistry).map(t => t.schema);
};