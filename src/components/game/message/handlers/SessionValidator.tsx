import { useToast } from '@/hooks/use-toast';

interface SessionValidatorProps {
  sessionId: string | null;
  campaignId: string | null;
  characterId: string | null;
}

/**
 * Custom hook for session validation
 */
export const useSessionValidator = ({ 
  sessionId, 
  campaignId, 
  characterId 
}: SessionValidatorProps) => {
  const { toast } = useToast();

  /**
   * Validates the current session and related entities
   */
  const validateSession = async (): Promise<boolean> => {
    if (!sessionId || !campaignId || !characterId) {
      toast({
        title: "Session Error",
        description: "Invalid session configuration. Please try again.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return { validateSession };
};