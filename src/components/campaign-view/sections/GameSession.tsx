import React, { useEffect, useState } from 'react';
import { GameInterface } from '@/components/GameInterface';
import { Button } from '@/components/ui/button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GameSessionProps {
  campaignId: string;
}

/**
 * GameSession component handles the game interface and session management
 * Creates a new session if none exists and manages character selection
 */
export const GameSession: React.FC<GameSessionProps> = ({ campaignId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const sessionId = searchParams.get('session');
  const characterId = searchParams.get('character');

  /**
   * Creates a new game session with the selected character
   */
  const createGameSession = async (selectedCharacterId: string) => {
    try {
      setIsCreatingSession(true);
      
      // Create new session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          campaign_id: campaignId,
          character_id: selectedCharacterId,
          status: 'active'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update URL with session ID
      setSearchParams(prev => {
        prev.set('session', sessionData.id);
        return prev;
      });

      toast({
        title: "Session Created",
        description: "Your game session has been started successfully.",
      });

    } catch (error) {
      console.error('Error creating game session:', error);
      toast({
        title: "Error",
        description: "Failed to create game session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  // If we have a character but no session, create one
  useEffect(() => {
    if (characterId && !sessionId && !isCreatingSession) {
      createGameSession(characterId);
    }
  }, [characterId, sessionId]);

  if (!characterId) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No Character Selected</h2>
        <p className="text-muted-foreground mb-4">
          Select a character to start playing this campaign
        </p>
        <Button
          onClick={() => navigate('/characters')}
          className="mx-auto"
        >
          Choose Character
        </Button>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Creating Session</h2>
        <p className="text-muted-foreground">
          Please wait while we set up your game session...
        </p>
      </div>
    );
  }

  return <GameInterface />;
};