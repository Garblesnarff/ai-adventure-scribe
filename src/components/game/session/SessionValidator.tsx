import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SessionValidatorProps {
  sessionId: string | null;
  campaignId: string | null;
  characterId: string | null;
}

/**
 * SessionValidator Component
 * Handles validation of game session data
 */
export const SessionValidator = async ({
  sessionId,
  campaignId,
  characterId,
}: SessionValidatorProps) => {
  const { toast } = useToast();

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