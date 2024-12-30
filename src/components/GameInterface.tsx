import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Interface for chat message structure
 */
interface ChatMessage {
  text: string;
  sender: 'player' | 'dm';
  id?: string;
  session_id?: string;
  timestamp?: string;
}

/**
 * GameInterface Component
 * Handles the game's chat interface and message persistence
 */
export const GameInterface = () => {
  const [playerInput, setPlayerInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize conversation with ElevenLabs
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "pNInz6obpgDQGcFmaJgB", // Fantasy narrator voice
      },
    },
  });

  /**
   * Create a new game session
   */
  const createGameSession = async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([{ session_number: 1 }])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating game session:', error);
      toast({
        title: "Error",
        description: "Failed to create game session",
        variant: "destructive",
      });
      return null;
    }

    return data.id;
  };

  /**
   * Initialize session on component mount
   */
  useEffect(() => {
    const initSession = async () => {
      const newSessionId = await createGameSession();
      setSessionId(newSessionId);
    };

    if (!sessionId) {
      initSession();
    }
  }, []);

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
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
        return [];
      }

      return data.map(msg => ({
        text: msg.message,
        sender: msg.speaker_type as 'player' | 'dm',
        id: msg.id,
        timestamp: msg.timestamp,
      }));
    },
    enabled: !!sessionId,
  });

  /**
   * Mutation for saving new messages
   */
  const messageMutation = useMutation({
    mutationFn: async (message: ChatMessage) => {
      const { error } = await supabase
        .from('dialogue_history')
        .insert([{
          session_id: sessionId,
          message: message.text,
          speaker_type: message.sender,
        }]);

      if (error) throw error;
    },
    onError: (error) => {
      console.error('Error saving message:', error);
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
    },
  });

  /**
   * Handle sending a new message
   */
  const handleSendMessage = async () => {
    if (!playerInput.trim() || !sessionId) return;

    // Add player message
    const playerMessage = { text: playerInput, sender: 'player' as const };
    await messageMutation.mutateAsync(playerMessage);
    
    // Simple DM response for now
    const dmResponse = {
      text: `The world responds to your words: "${playerInput}"... What would you like to do next?`,
      sender: 'dm' as const
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
        
        <div className="h-[60vh] overflow-y-auto mb-4 space-y-4 p-4">
          {messages.map((message) => (
            <div
              key={message.id || message.timestamp}
              className={`p-3 rounded-lg ${
                message.sender === 'dm'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="What would you like to do?"
            className="flex-1"
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </Card>
    </div>
  );
};