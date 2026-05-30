export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConversationMemory {
  [userId: string]: ChatMessage[];
}