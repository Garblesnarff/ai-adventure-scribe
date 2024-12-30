import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useConversation } from '@11labs/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/game';
import { useGameSession } from '@/hooks/useGameSession';
import { useMessageQueue } from '@/hooks/useMessageQueue';
import { MessageList } from './game/MessageList';

/**
 * GameInterface Component
 * Handles the game's chat interface and message persistence
 */
export const GameInterface = () => {
  const [playerInput, setPlayerInput] = useState('');
  const { sessionId } = useGameSession();
  const { messageMutation, queueStatus } = useMessageQueue(sessionId);

  // Initialize conversation with ElevenLabs
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "pNInz6obpgDQGcFmaJgB", // Fantasy narrator voice
      },
    },
  });

  /**
   * Fetch messages for current session
   */
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('dialogue_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data.map(msg => ({
        text: msg.message,
        sender: msg.speaker_type as ChatMessage['sender'],
        id: msg.id,
        timestamp: msg.timestamp,
        context: msg.context,
      }));
    },
    enabled: !!sessionId,
  });

  /**
   * Handle sending a new message
   */
  const handleSendMessage = async () => {
    if (!playerInput.trim() || !sessionId || queueStatus === 'processing') return;

    // Add player message
    const playerMessage: ChatMessage = {
      text: playerInput,
      sender: 'player',
      context: {
        emotion: 'neutral',
        intent: 'query',
      },
    };
    await messageMutation.mutateAsync(playerMessage);
    
    // Add system acknowledgment
    const systemMessage: ChatMessage = {
      text: "Processing your request...",
      sender: 'system',
      context: {
        intent: 'acknowledgment',
      },
    };
    await messageMutation.mutateAsync(systemMessage);
    
    // Simple DM response for now
    const dmResponse: ChatMessage = {
      text: `The world responds to your words: "${playerInput}"... What would you like to do next?`,
      sender: 'dm',
      context: {
        emotion: 'neutral',
        intent: 'response',
        location: 'current_scene',
      },
    };
    await messageMutation.mutateAsync(dmResponse);
    
    setPlayerInput('');

    // Speak the DM's response
    try {
      await conversation.startSession({
        agentId: "your_agent_id", // Replace with actual agent ID
      });
      // Text-to-speech would go here
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/parchment-bg.png')] bg-cover p-4">
      <Card className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl p-6">
        <h1 className="text-4xl text-center mb-6 text-primary">D&D Adventure</h1>
        
        <MessageList messages={messages} />

        <div className="flex gap-2">
          <Input
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="What would you like to do?"
            className="flex-1"
            disabled={queueStatus === 'processing'}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={queueStatus === 'processing'}
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
};