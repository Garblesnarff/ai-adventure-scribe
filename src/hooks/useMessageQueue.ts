import { useState } from 'react';
import { ChatMessage } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Hook for managing message queue and persistence
 * @param sessionId Current game session ID
 */
export const useMessageQueue = (sessionId: string | null) => {
  const [queueStatus, setQueueStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Handles message persistence with retry logic
   */
  const messageMutation = useMutation({
    mutationFn: async (message: ChatMessage) => {
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          setQueueStatus('processing');
          
          // Format the context to ensure it's compatible with Supabase's Json type
          const contextData = message.context ? {
            location: message.context.location || null,
            emotion: message.context.emotion || null,
            intent: message.context.intent || null
          } : {};

          const { error } = await supabase
            .from('dialogue_history')
            .insert({
              session_id: sessionId,
              message: message.text,
              speaker_type: message.sender,
              context: contextData
            });

          if (error) throw error;
          setQueueStatus('idle');
          return;
        } catch (error) {
          console.error(`Attempt ${retries + 1} failed:`, error);
          retries++;
          if (retries === MAX_RETRIES) {
            setQueueStatus('error');
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    },
    onError: (error) => {
      console.error('Error saving message:', error);
      toast({
        title: "Error",
        description: "Failed to save message. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
    },
  });

  return { messageMutation, queueStatus };
};