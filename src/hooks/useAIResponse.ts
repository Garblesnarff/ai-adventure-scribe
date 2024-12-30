import { ChatMessage } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { selectRelevantMemories } from '@/utils/memorySelection';

/**
 * Hook for handling AI response generation with memory context window
 */
export const useAIResponse = () => {
  /**
   * Calls the AI chat edge function to generate a response
   * Now includes memory window management
   */
  const getAIResponse = async (messages: ChatMessage[], sessionId: string) => {
    try {
      // Get latest message context
      const latestMessage = messages[messages.length - 1];
      const context = latestMessage?.context || null;

      // Fetch and select relevant memories
      const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .eq('session_id', sessionId);

      const selectedMemories = selectRelevantMemories(
        memories || [],
        context
      );

      // Call AI function with selected memories
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { 
          messages, 
          sessionId,
          selectedMemories 
        },
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