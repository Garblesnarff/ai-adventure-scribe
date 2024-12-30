import React from 'react';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/types/game';
import { useGameSession } from '@/hooks/useGameSession';
import { MessageProvider, useMessageContext } from '@/contexts/MessageContext';
import { MessageList } from './game/MessageList';
import { ChatInput } from './game/ChatInput';
import { VoiceHandler } from './game/VoiceHandler';

/**
 * GameContent Component
 * Handles the main game interaction logic and UI
 */
const GameContent: React.FC = () => {
  const { messages, sendMessage, queueStatus } = useMessageContext();
  const { toast } = useToast();

  /**
   * Handle sending a new message
   * Processes player input and generates appropriate responses
   * @param playerInput - The message text from the player
   */
  const handleSendMessage = async (playerInput: string) => {
    if (queueStatus === 'processing') return;

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
    
    // Generate DM response
    const dmResponse: ChatMessage = {
      text: `The world responds to your words: "${playerInput}"... What would you like to do next?`,
      sender: 'dm',
      context: {
        emotion: 'neutral',
        intent: 'response',
        location: 'current_scene',
      },
    };
    await sendMessage(dmResponse);
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
        <GameContent />
      </MessageProvider>
    </div>
  );
};