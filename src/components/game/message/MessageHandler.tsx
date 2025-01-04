import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/types/game';
import { useMessageContext } from '@/contexts/MessageContext';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { useAIResponse } from '@/hooks/useAIResponse';
import { SessionValidator } from '../session/SessionValidator';

interface MessageHandlerProps {
  sessionId: string | null;
  campaignId: string | null;
  characterId: string | null;
  children: (props: {
    handleSendMessage: (message: string) => Promise<void>;
    isProcessing: boolean;
  }) => React.ReactNode;
}

/**
 * MessageHandler Component
 * Manages message processing and AI responses
 */
export const MessageHandler: React.FC<MessageHandlerProps> = ({
  sessionId,
  campaignId,
  characterId,
  children,
}) => {
  const { messages, sendMessage, queueStatus } = useMessageContext();
  const { extractMemories } = useMemoryContext();
  const { getAIResponse } = useAIResponse();
  const { toast } = useToast();

  const handleSendMessage = async (playerInput: string) => {
    if (queueStatus === 'processing') return;

    try {
      // Validate session before proceeding
      const isValid = await SessionValidator({
        sessionId,
        campaignId,
        characterId,
      });
      
      if (!isValid) return;

      // Add player message
      const playerMessage: ChatMessage = {
        text: playerInput,
        sender: 'player',
        context: {
          emotion: 'neutral',
          intent: 'query',
        },
      };
      await sendMessage(playerMessage);
      
      // Extract memories from player input
      await extractMemories(playerInput, 'general');
      
      // Add system acknowledgment
      const systemMessage: ChatMessage = {
        text: "Processing your request...",
        sender: 'system',
        context: {
          intent: 'acknowledgment',
        },
      };
      await sendMessage(systemMessage);
      
      // Get AI response
      if (!sessionId) {
        throw new Error('No active session found');
      }
      
      const aiResponse = await getAIResponse([...messages, playerMessage], sessionId);
      await sendMessage(aiResponse);
      
      // Extract memories from AI response
      if (aiResponse.text) {
        await extractMemories(aiResponse.text, 'event');
      }

    } catch (error) {
      console.error('Error in message flow:', error);
      toast({
        title: "Error",
        description: "Failed to process message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return children({
    handleSendMessage,
    isProcessing: queueStatus === 'processing',
  });
};