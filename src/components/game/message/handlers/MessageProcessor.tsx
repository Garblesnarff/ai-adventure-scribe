import React from 'react';
import { ChatMessage } from '@/types/game';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { useAIResponse } from '@/hooks/useAIResponse';
import { useToast } from '@/hooks/use-toast';

interface MessageProcessorProps {
  sessionId: string;
  messages: ChatMessage[];
  onProcessingComplete: () => void;
  onError: (error: Error) => void;
}

/**
 * MessageProcessor Component
 * Handles processing of messages and memory extraction
 */
export const MessageProcessor: React.FC<MessageProcessorProps> = ({
  sessionId,
  messages,
  onProcessingComplete,
  onError,
}) => {
  const { extractMemories } = useMemoryContext();
  const { getAIResponse } = useAIResponse();
  const { toast } = useToast();

  /**
   * Processes a message and returns AI response
   */
  const processMessage = async (): Promise<ChatMessage> => {
    try {
      // Extract memories from player input
      try {
        const playerMessage = messages[messages.length - 1];
        await extractMemories(playerMessage.text);
      } catch (memoryError) {
        console.error('[MessageProcessor] Memory extraction error:', memoryError);
        toast({
          title: "Memory System Warning",
          description: "Memory extraction encountered an issue but message processing will continue",
          variant: "destructive",
        });
      }

      // Get AI response
      const aiResponse = await getAIResponse(messages, sessionId);

      // Extract memories from AI response
      if (aiResponse.text) {
        try {
          await extractMemories(aiResponse.text);
        } catch (memoryError) {
          console.error('[MessageProcessor] Memory extraction error for AI response:', memoryError);
        }
      }

      onProcessingComplete();
      return aiResponse;
    } catch (error) {
      console.error('[MessageProcessor] Error in message processing:', error);
      onError(error as Error);
      throw error;
    }
  };

  return null; // This is a logic-only component
};