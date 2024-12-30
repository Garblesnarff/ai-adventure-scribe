/**
 * Types for chat-ai function
 */
export interface ChatMessage {
  text: string;
  sender: 'player' | 'dm' | 'system';
  context?: {
    location?: string;
    emotion?: string;
    intent?: string;
  };
}

export interface Memory {
  id: string;
  content: string;
  type: string;
  importance: number;
  embedding?: number[];
  created_at: string;
}

export interface MemoryContext {
  relevanceScore: number;
  memory: Memory;
}