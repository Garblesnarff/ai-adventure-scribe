export type SpeakerType = 'player' | 'dm' | 'system';

export interface ChatMessage {
  text: string;
  sender: SpeakerType;
  id?: string;
  session_id?: string;
  timestamp?: string;
  context?: {
    location?: string;
    emotion?: string;
    intent?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface GameSession {
  id: string;
  session_number: number;
  start_time: string;
  end_time?: string;
  summary?: string;
}