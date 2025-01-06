import { ChatMessage } from '@/types/game';
import { createRoot } from 'react-dom/client';
import { MessageProcessor } from '@/components/game/message/handlers/MessageProcessor';

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
    return new Promise<ChatMessage>((resolve, reject) => {
      try {
        // Create container for MessageProcessor
        const container = document.createElement('div');
        const root = createRoot(container);
        
        // Render MessageProcessor
        root.render(
          <MessageProcessor
            sessionId={sessionId}
            messages={[...messages, playerMessage]}
            onProcessingComplete={() => {
              console.log('[MessageProcessor] Processing completed');
              root.unmount(); // Cleanup
            }}
            onError={(error) => {
              console.error('[MessageProcessor] Error:', error);
              root.unmount(); // Cleanup
              reject(error);
            }}
          />
        );
      } catch (error) {
        console.error('[MessageProcessing] Setup error:', error);
        reject(error);
      }
    });
  };

  return { processMessage };
};