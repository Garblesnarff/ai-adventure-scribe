/**
 * Interface for memory data structure
 */
export interface Memory {
  id: string;
  content: string;
  type: string;
  importance: number;
  embedding?: number[] | string | null;
  metadata: Record<string, any>;
  created_at: string;
  session_id?: string | null;
  updated_at: string;
}

/**
 * Interface for memory with relevance score
 */
export interface MemoryContext {
  memory: Memory;
  relevanceScore: number;
}