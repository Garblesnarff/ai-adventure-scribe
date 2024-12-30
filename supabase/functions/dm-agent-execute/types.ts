/**
 * Interface for chat messages in the system
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for agent context information
 */
export interface AgentContext {
  role: string;
  goal: string;
  backstory: string;
}

/**
 * Interface for task execution response
 */
export interface TaskExecutionResponse {
  response: string;
  error?: string;
}