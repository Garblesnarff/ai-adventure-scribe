import React, { useEffect } from 'react';
import { GameInterface } from '@/components/GameInterface';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GameSessionProps {
  campaignId: string;
}

/**
 * GameSession component handles the game interface and session management
 * Ensures a valid game session exists before rendering the game interface
 */
export const GameSession: React.FC<GameSessionProps> = ({ campaignId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const { toast } = useToast();

  /**
   * Creates a new game session for the campaign
   */
  const createGameSession = async () => {
    try {
      // Create new session
      const { data: session, error } = await supabase
        .from('game_sessions')
        .insert({
          campaign_id: campaignId,
          session_number: 1,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Update URL with new session ID
      setSearchParams(prev => {
        prev.set('session', session.id);
        return prev;
      });

      toast({
        title: "Session Created",
        description: "Your game session has been initialized.",
      });
    } catch (error) {
      console.error('Error creating game session:', error);
      toast({
        title: "Error",
        description: "Failed to create game session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Verify session exists and is valid
  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) return;

      const { data: session, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('campaign_id', campaignId)
        .single();

      if (error || !session) {
        console.error('Invalid session:', error);
        setSearchParams(prev => {
          prev.delete('session');
          return prev;
        });
        toast({
          title: "Session Error",
          description: "Invalid or expired session. Please start a new game.",
          variant: "destructive",
        });
      }
    };

    verifySession();
  }, [sessionId, campaignId]);

  if (!sessionId) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No Active Session</h2>
        <p className="text-muted-foreground mb-4">
          Start a new game session to begin playing
        </p>
        <Button
          onClick={createGameSession}
          className="mx-auto"
        >
          Start New Session
        </Button>
      </div>
    );
  }

  return <GameInterface />;
};