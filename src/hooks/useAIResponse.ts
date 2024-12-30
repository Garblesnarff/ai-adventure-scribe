import { ChatMessage } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for handling AI response generation with memory context
 */
export const useAIResponse = () => {
  /**
   * Calls the AI chat edge function to generate a response
   * @param messages - Array of chat messages
   * @param sessionId - Current game session ID
   * @returns AI generated response
   */
  const getAIResponse = async (messages: ChatMessage[], sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { messages, sessionId },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error calling AI:', error);
      throw error;
    }
  };

  return { getAIResponse };
};