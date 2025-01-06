import { ChatMessage } from '@/types/game';

/**
 * Custom hook for processing messages through the AI system
 * @param sessionId Current game session ID
 * @param messages Array of chat messages
 * @returns Function to process messages
 */
export const useMessageProcessing = (sessionId: string, messages: ChatMessage[]) => {
  /**
   * Processes a message through the AI system
   * @param playerMessage Message to be processed
   * @returns Promise resolving to AI response
   */
  const processMessage = async (playerMessage: ChatMessage): Promise<ChatMessage> => {
    try {
      const response = await fetch('/api/process-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          messages: [...messages, playerMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('[MessageProcessing] Error:', error);
      throw error;
    }
  };

  return { processMessage };
};