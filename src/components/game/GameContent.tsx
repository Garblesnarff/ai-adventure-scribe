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
import { supabase } from '@/integrations/supabase/client';
import { useParams, useSearchParams } from 'react-router-dom';

/**
 * GameContent Component
 * Handles the main game interaction logic and UI
 */
const GameContent: React.FC = () => {
  const { messages, sendMessage, queueStatus } = useMessageContext();
  const { extractMemories } = useMemoryContext();
  const { getAIResponse } = useAIResponse();
  const { id: campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const characterId = searchParams.get('character');
  const sessionId = searchParams.get('session');
  const { toast } = useToast();

  /**
   * Validates the current game session
   * @returns boolean indicating if session is valid
   */
  const validateGameSession = async () => {
    if (!sessionId || !campaignId || !characterId) {
      console.error('Missing required IDs:', { sessionId, campaignId, characterId });
      toast({
        title: "Session Error",
        description: "Missing required session information",
        variant: "destructive",
      });
      return false;
    }

    // Verify session exists with required data
    const { data: session, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('campaign_id', campaignId)
      .eq('character_id', characterId)
      .single();

    if (error || !session) {
      console.error('Session validation failed:', error || 'Session not found');
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

  return (
    <div className="flex gap-4 max-w-7xl mx-auto">
      <Card className="flex-1 bg-white/90 backdrop-blur-sm shadow-xl p-6">
        <h1 className="text-4xl text-center mb-6 text-primary">D&D Adventure</h1>
        {/* Add VoiceHandler at the top level to ensure it has access to messages */}
        <VoiceHandler />
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