import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GameSession } from '@/types/game';

const SESSION_EXPIRY_TIME = 1000 * 60 * 60; // 1 hour
const CLEANUP_INTERVAL = 1000 * 60 * 5; // Check every 5 minutes

/**
 * Hook for managing game sessions with enhanced cleanup and summary generation
 */
export const useGameSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<'active' | 'expired' | 'ending'>('active');
  const { toast } = useToast();

  /**
   * Creates a new game session
   */
  const createGameSession = async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([{ 
        session_number: 1,
        status: 'active'
      }])
      .select()
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
   * Generates a summary for the session based on dialogue history
   */
  const generateSessionSummary = async (sessionId: string) => {
    const { data: messages } = await supabase
      .from('dialogue_history')
      .select('message, speaker_type, context')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (!messages?.length) return "No activity recorded in this session";

    // Simple summary generation - can be enhanced with AI later
    const messageCount = messages.length;
    const playerActions = messages.filter(m => m.speaker_type === 'player').length;
    const dmResponses = messages.filter(m => m.speaker_type === 'dm').length;

    return `Session completed with ${messageCount} total interactions: ${playerActions} player actions and ${dmResponses} DM responses.`;
  };

  /**
   * Checks if a session has expired
   */
  const isSessionExpired = (session: GameSession) => {
    const startTime = new Date(session.start_time).getTime();
    return Date.now() - startTime > SESSION_EXPIRY_TIME;
  };

  /**
   * Cleans up expired session with summary
   */
  const cleanupSession = async (sessionId: string) => {
    setSessionState('ending');
    const summary = await generateSessionSummary(sessionId);
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        end_time: new Date().toISOString(),
        summary,
        status: 'completed' as const
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error cleaning up session:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup session properly",
        variant: "destructive",
      });
    }
    
    setSessionState('expired');
    return summary;
  };

  /**
   * Initialize and maintain session
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

        if (session && isSessionExpired(session as GameSession)) {
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
        setSessionState('active');
      }
    };

    initSession();

    // Set up periodic cleanup check
    const cleanup = setInterval(async () => {
      if (sessionId) {
        const { data: session } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (session && isSessionExpired(session as GameSession)) {
          await cleanupSession(sessionId);
        }
      }
    }, CLEANUP_INTERVAL);

    return () => {
      clearInterval(cleanup);
    };
  }, [sessionId]);

  return { sessionId, setSessionId, sessionState };
};