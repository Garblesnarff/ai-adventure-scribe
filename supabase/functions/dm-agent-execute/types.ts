/**
 * Interface for chat messages in the system
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for campaign details
 */
export interface CampaignDetails {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  difficulty_level?: string;
  campaign_length?: string;
  tone?: string;
  setting_details?: Record<string, any>;
}

/**
 * Interface for agent context information
 */
export interface AgentContext {
  role: string;
  goal: string;
  backstory: string;
  campaignDetails?: CampaignDetails;
}

/**
 * Interface for task execution response
 */
export interface TaskExecutionResponse {
  response: string;
  error?: string;
}