import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GameSession } from '@/types/game';

const SESSION_EXPIRY_TIME = 1000 * 60 * 60; // 1 hour

export const useGameSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Creates a new game session
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
   * Checks if a session has expired
   */
  const isSessionExpired = (session: GameSession) => {
    const startTime = new Date(session.start_time).getTime();
    return Date.now() - startTime > SESSION_EXPIRY_TIME;
  };

  /**
   * Cleans up expired session
   */
  const cleanupSession = async (sessionId: string) => {
    const summary = "Session expired due to inactivity";
    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        end_time: new Date().toISOString(),
        summary 
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error cleaning up session:', error);
    }
    return summary;
  };

  /**
   * Initialize session on component mount
   */
  useEffect(() => {
    const initSession = async () => {
      // Check for existing session
      if (sessionId) {
        const { data: session } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (session && isSessionExpired(session)) {
          const summary = await cleanupSession(sessionId);
          toast({
            title: "Session Expired",
            description: summary,
          });
          setSessionId(null);
        }
      }

      // Create new session if needed
      if (!sessionId) {
        const newSessionId = await createGameSession();
        setSessionId(newSessionId);
      }
    };

    initSession();
  }, [sessionId]);

  return { sessionId, setSessionId };
};