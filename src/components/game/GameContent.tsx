import React from 'react';
import { Card } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/types/game';
import { useMessageContext } from '@/contexts/MessageContext';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { VoiceHandler } from './VoiceHandler';
import { useAIResponse } from '@/hooks/useAIResponse';

/**
 * GameContent Component
 * Handles the main game interaction logic and UI
 */
const GameContent: React.FC = () => {
  const { messages, sendMessage, queueStatus } = useMessageContext();
  const { extractMemories } = useMemoryContext();
  const { getAIResponse } = useAIResponse();
  const { toast } = useToast();

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

export default GameContent;