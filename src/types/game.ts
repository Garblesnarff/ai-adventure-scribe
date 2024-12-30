export type SpeakerType = 'player' | 'dm' | 'system';

export type SessionStatus = 'active' | 'expired' | 'ending';

/**
 * Interface defining the structure of message context data
 * Must be compatible with Supabase's Json type
 */
export interface MessageContext {
  [key: string]: string | null | undefined;
  location?: string | null;
  emotion?: string | null;
  intent?: string | null;
}

/**
 * Interface for chat messages in the game
 */
export interface ChatMessage {
  text: string;
  sender: SpeakerType;
  id?: string;
  timestamp?: string;
  context?: MessageContext;
}

/**
 * Interface for game session data
 */
export interface GameSession {
  id: string;
  session_number: number;
  start_time: string;
  end_time?: string;
  summary?: string;
  status: 'active' | 'completed' | 'expired';
}

/**
 * Interface for campaign data
 * Matches the structure from the Supabase campaigns table
 */
export interface Campaign {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  genre?: string;
  difficulty_level?: string;
  status?: string;
  campaign_length?: string;
  tone?: string;
  setting_details?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}