import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/types/game';
import { useMessageContext } from '@/contexts/MessageContext';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { useAIResponse } from '@/hooks/useAIResponse';
import { useSessionValidator } from '../session/SessionValidator';

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
 * Manages message processing and AI responses with improved error handling
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
  const validateSession = useSessionValidator({ sessionId, campaignId, characterId });

  const handleSendMessage = async (playerInput: string) => {
    if (queueStatus === 'processing') {
      console.log('[MessageHandler] Message already processing, skipping');
      return;
    }

    try {
      // Validate session before proceeding
      const isValid = await validateSession();
      if (!isValid) {
        toast({
          title: "Session Error",
          description: "Invalid game session. Please try refreshing the page.",
          variant: "destructive",
        });
        return;
      }

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
      
      try {
        // Extract memories from player input
        await extractMemories(playerInput);
      } catch (memoryError) {
        console.error('[MessageHandler] Memory extraction error:', memoryError);
        // Continue with message flow even if memory extraction fails
      }
      
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
      
      try {
        // Extract memories from AI response
        if (aiResponse.text) {
          await extractMemories(aiResponse.text);
        }
      } catch (memoryError) {
        console.error('[MessageHandler] Memory extraction error for AI response:', memoryError);
        // Continue even if memory extraction fails
      }

    } catch (error: any) {
      console.error('Error in message flow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return children({
    handleSendMessage,
    isProcessing: queueStatus === 'processing',
  });
};