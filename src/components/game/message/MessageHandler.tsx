import React, { useState } from 'react';
import { ChatMessage } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMessageContext } from '@/contexts/MessageContext';

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
  const { sendMessage } = useMessageContext();

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
        text: messageContent,
        sender: 'player',
        timestamp: new Date().toISOString(),
      };

      // Send player message to context
      await sendMessage(playerMessage);

      console.log('Sending message to chat function:', {
        message: playerMessage,
        sessionId,
        campaignId,
        characterId
      });

      // Process the message through the AI system using Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: playerMessage,
          sessionId,
          campaignId,
          characterId,
        },
      });

      if (error) throw error;

      console.log('Chat function response:', data);

      // Send DM response to context
      if (data) {
        await sendMessage(data);
      }

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