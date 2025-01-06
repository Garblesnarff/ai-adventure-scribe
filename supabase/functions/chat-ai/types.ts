export interface ChatMessage {
  id: string;
  text: string;
  sender: 'player' | 'dm' | 'system';
  timestamp: string;
  context?: {
    emotion?: string;
    intent?: string;
    location?: string;
  };
}