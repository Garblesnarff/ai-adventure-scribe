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
import { MemoryPanel } from './MemoryPanel';
import { useGameSession } from '@/hooks/useGameSession';
import { MemoryTester } from './memory/MemoryTester';

/**
 * GameContent Component
 * Handles the main game interaction logic and UI
 */
const GameContent: React.FC = () => {
  const { messages, sendMessage, queueStatus } = useMessageContext();
  const { extractMemories } = useMemoryContext();
  const { getAIResponse } = useAIResponse();
  const { sessionId } = useGameSession();
  const { toast } = useToast();

  /**
   * Validates the current game session
   * @returns boolean indicating if session is valid
   */
  const validateGameSession = async () => {
    if (!sessionId) {
      toast({
        title: "Session Error",
        description: "No active game session found",
        variant: "destructive",
      });
      return false;
    }

    // Verify session exists with required data
    const { data: session, error } = await supabase
      .from('game_sessions')
      .select(`
        id,
        campaign_id,
        character_id
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session?.campaign_id || !session?.character_id) {
      console.error('Session validation failed:', error || 'Missing campaign/character IDs');
      toast({
        title: "Session Error",
        description: "Invalid game session. Please try starting a new game.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  /**
   * Handle sending a new message
   * Processes player input and generates appropriate responses
   * @param playerInput - The message text from the player
   */
  const handleSendMessage = async (playerInput: string) => {
    if (queueStatus === 'processing') return;

    try {
      // Validate session before proceeding
      const isValid = await validateGameSession();
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
      
      // Get AI response with session context
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

  return (
    <div className="flex gap-4 max-w-7xl mx-auto">
      <Card className="flex-1 bg-white/90 backdrop-blur-sm shadow-xl p-6">
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
        <MemoryTester />
      </Card>
      <MemoryPanel />
    </div>
  );
};

export default GameContent;