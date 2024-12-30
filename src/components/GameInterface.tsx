import React from 'react';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/types/game';
import { useGameSession } from '@/hooks/useGameSession';
import { MessageProvider, useMessageContext } from '@/contexts/MessageContext';
import { MemoryProvider, useMemoryContext } from '@/contexts/MemoryContext';
import { MessageList } from './game/MessageList';
import { ChatInput } from './game/ChatInput';
import { VoiceHandler } from './game/VoiceHandler';
import { supabase } from '@/integrations/supabase/client';

/**
 * GameContent Component
 * Handles the main game interaction logic and UI
 */
const GameContent: React.FC = () => {
  const { messages, sendMessage, queueStatus } = useMessageContext();
  const { extractMemories } = useMemoryContext();
  const { toast } = useToast();

  /**
   * Calls the AI chat edge function to generate a response
   * @param messages - Array of chat messages
   * @returns AI generated response
   */
  const getAIResponse = async (messages: ChatMessage[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { messages },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error calling AI:', error);
      throw error;
    }
  };

  /**
   * Handle sending a new message
   * Processes player input and generates appropriate responses
   * @param playerInput - The message text from the player
   */
  const handleSendMessage = async (playerInput: string) => {
    if (queueStatus === 'processing') return;

    try {
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
      const aiResponse = await getAIResponse([...messages, playerMessage]);
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

  return (
    <Card className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl p-6">
      <h1 className="text-4xl text-center mb-6 text-primary">D&D Adventure</h1>
      <VoiceHandler 
        onError={(error) => {
          toast({
            title: "Voice Error",
            description: error.message,
            variant: "destructive",
          });
        }}
      />
      <MessageList messages={messages} />
      <ChatInput 
        onSendMessage={handleSendMessage}
        isDisabled={queueStatus === 'processing'}
      />
    </Card>
  );
};

/**
 * GameInterface Component
 * Main component for handling game interactions and message flow
 * Manages the chat interface and message persistence
 */
export const GameInterface: React.FC = () => {
  const { sessionId } = useGameSession();

  return (
    <div className="min-h-screen bg-[url('/parchment-bg.png')] bg-cover p-4">
      <MessageProvider sessionId={sessionId}>
        <MemoryProvider sessionId={sessionId}>
          <GameContent />
        </MemoryProvider>
      </MessageProvider>
    </div>
  );
};