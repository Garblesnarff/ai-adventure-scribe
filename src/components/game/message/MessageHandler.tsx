import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/types/game';
import { useMessageContext } from '@/contexts/MessageContext';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { useSessionValidator } from './handlers/SessionValidator';
import { MessageProcessor } from './handlers/MessageProcessor';

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
  const { toast } = useToast();
  const { validateSession } = useSessionValidator({ 
    sessionId, 
    campaignId, 
    characterId 
  });

  /**
   * Handles the message sending flow with validation and error handling
   */
  const handleSendMessage = async (playerInput: string) => {
    if (queueStatus === 'processing') {
      console.log('[MessageHandler] Message already processing, skipping');
      return;
    }

    try {
      // Validate session before proceeding
      const isValid = await validateSession();
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

      // Add system acknowledgment
      const systemMessage: ChatMessage = {
        text: "Processing your request...",
        sender: 'system',
        context: {
          intent: 'acknowledgment',
        },
      };
      await sendMessage(systemMessage);

      // Process message and get AI response
      if (!sessionId) throw new Error('No active session found');

      const aiResponse = await new Promise<ChatMessage>((resolve, reject) => {
        // Create a container element to render the MessageProcessor
        const container = document.createElement('div');
        
        // Render MessageProcessor into the container
        React.render(
          <MessageProcessor
            sessionId={sessionId}
            messages={[...messages, playerMessage]}
            onProcessingComplete={() => {
              console.log('[MessageHandler] Message processing completed');
            }}
            onError={(error) => {
              console.error('[MessageHandler] Processing error:', error);
              reject(error);
            }}
          />,
          container
        );
      });

      await sendMessage(aiResponse);

    } catch (error: any) {
      console.error('[MessageHandler] Error in message flow:', error);
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