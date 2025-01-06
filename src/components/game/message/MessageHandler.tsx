import React, { useState } from 'react';
import { ChatMessage } from '@/types/game';
import { useToast } from '@/hooks/use-toast';

interface MessageHandlerProps {
  sessionId: string | null;
  campaignId: string | undefined;
  characterId: string | null;
  children: (props: {
    handleSendMessage: (message: string) => Promise<void>;
    isProcessing: boolean;
  }) => React.ReactNode;
}

/**
 * MessageHandler Component
 * Handles the processing and management of chat messages
 */
export const MessageHandler: React.FC<MessageHandlerProps> = ({
  sessionId,
  campaignId,
  characterId,
  children
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  /**
   * Handles sending a new message
   * @param messageContent Content of the message to send
   */
  const handleSendMessage = async (messageContent: string) => {
    if (!sessionId || !campaignId || !characterId) {
      toast({
        title: "Error",
        description: "Missing required session information",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create the player message
      const playerMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: messageContent,
        role: 'user',
        timestamp: new Date().toISOString(),
      };

      // Process the message through the AI system
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: playerMessage,
          sessionId,
          campaignId,
          characterId,
        }),
      });

    } catch (error) {
      console.error('[MessageHandler] Error:', error);
      toast({
        title: "Error",
        description: "Failed to process message",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return <>{children({ handleSendMessage, isProcessing })}</>;
};