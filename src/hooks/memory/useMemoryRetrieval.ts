/**
 * Hook for handling memory retrieval operations
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Memory } from '@/components/game/memory/types';

/**
 * Custom hook for retrieving and managing memories
 */
export const useMemoryRetrieval = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['memories', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      console.log('[Memory] Fetching memories for session:', sessionId);
      
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Memory] Error fetching memories:', error);
        throw error;
      }

      console.log(`[Memory] Retrieved ${data.length} memories`);
      
      return data.map((memory: Memory) => ({
        ...memory,
        embedding: typeof memory.embedding === 'string' 
          ? JSON.parse(memory.embedding)
          : memory.embedding,
      }));
    },
    enabled: !!sessionId,
  });
};