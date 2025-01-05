/**
 * Hook for handling memory retrieval operations
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Memory, isValidMemoryType } from '@/components/game/memory/types';

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
      
      // Transform and validate the data to match Memory type
      return data.map((memory): Memory => {
        // Validate and ensure memory type is correct
        const validatedType = isValidMemoryType(memory.type) ? memory.type : 'general';
        
        if (validatedType !== memory.type) {
          console.warn(`[Memory] Invalid memory type detected: ${memory.type}, defaulting to 'general'`);
        }

        return {
          id: memory.id,
          type: validatedType,
          content: memory.content,
          importance: memory.importance || 0,
          embedding: typeof memory.embedding === 'string' 
            ? JSON.parse(memory.embedding)
            : memory.embedding,
          metadata: memory.metadata,
          created_at: memory.created_at || new Date().toISOString(),
          session_id: memory.session_id,
          updated_at: memory.updated_at || new Date().toISOString(),
        };
      });
    },
    enabled: !!sessionId,
  });
};