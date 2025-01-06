import React, { useEffect } from 'react';
import { GameInterface } from '@/components/GameInterface';
import { Button } from '@/components/ui/button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface GameSessionProps {
  campaignId: string;
}

/**
 * GameSession component handles the game interface and session management
 * @param campaignId - ID of the current campaign
 */
export const GameSession: React.FC<GameSessionProps> = ({ campaignId }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const sessionId = searchParams.get('session');
  const characterId = searchParams.get('character');
  const [isLoading, setIsLoading] = React.useState(true);
  const [sessionStatus, setSessionStatus] = React.useState<'active' | 'expired' | 'error' | null>(null);

  /**
   * Creates a new game session for the campaign and character
   */
  const createGameSession = async () => {
    try {
      console.log('Creating new game session...');
      const { data: session, error } = await supabase
        .from('game_sessions')
        .insert({
          campaign_id: campaignId,
          character_id: characterId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Update URL with new session ID
      navigate(`/campaign/${campaignId}?session=${session.id}&character=${characterId}`);

      toast({
        title: "Session Started",
        description: "Your game session has begun!",
      });

      setSessionStatus('active');
      return session;
    } catch (error) {
      console.error('Error creating game session:', error);
      setSessionStatus('error');
      toast({
        title: "Error",
        description: "Failed to start game session",
        variant: "destructive",
      });
      return null;
    }
  };

  /**
   * Validates the current session and creates a new one if needed
   */
  const validateSession = async () => {
    setIsLoading(true);
    try {
      if (!sessionId && characterId) {
        await createGameSession();
      } else if (sessionId) {
        console.log('Validating existing session...');
        const { data: session, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;

        if (!session) {
          console.log('Session not found or inactive, creating new one');
          await createGameSession();
        } else {
          console.log('Valid active session found:', session.id);
          setSessionStatus('active');
        }
      }
    } catch (error) {
      console.error('Session validation error:', error);
      if (characterId) {
        await createGameSession();
      } else {
        setSessionStatus('error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles cleanup when component unmounts or session ends
   */
  const cleanupSession = async () => {
    if (sessionId) {
      try {
        const { error } = await supabase
          .from('game_sessions')
          .update({ 
            status: 'completed',
            end_time: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (error) throw error;
      } catch (error) {
        console.error('Error cleaning up session:', error);
      }
    }
  };

  // Initialize session
  useEffect(() => {
    validateSession();
  }, [sessionId, characterId, campaignId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading session...</span>
      </div>
    );
  }

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

  if (sessionStatus === 'error') {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>
          There was an error with your game session. Please try refreshing the page or selecting a different character.
        </AlertDescription>
      </Alert>
    );
  }

  if (sessionStatus !== 'active') {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Initializing session...</span>
      </div>
    );
  }

  return <GameInterface sessionId={sessionId} />;
};