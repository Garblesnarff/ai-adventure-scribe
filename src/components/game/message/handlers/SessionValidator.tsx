import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SessionValidatorProps {
  sessionId: string | null;
  campaignId: string | null;
  characterId: string | null;
}

/**
 * Validates the game session and related entities
 */
export const useSessionValidator = ({ 
  sessionId, 
  campaignId, 
  characterId 
}: SessionValidatorProps) => {
  const { toast } = useToast();

  const validateSession = async () => {
    try {
      if (!sessionId || !campaignId || !characterId) {
        throw new Error('Missing required session parameters');
      }

      const { data: session, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('campaign_id', campaignId)
        .eq('character_id', characterId)
        .single();

      if (error || !session) {
        throw new Error('Invalid game session');
      }

      return true;
    } catch (error) {
      console.error('[SessionValidator] Validation error:', error);
      toast({
        title: "Session Error",
        description: "Failed to validate game session. Please try refreshing the page.",
        variant: "destructive",
      });
      return false;
    }
  };

  return { validateSession };
};