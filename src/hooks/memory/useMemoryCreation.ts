/**
 * Hook for handling memory creation operations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { processContent } from '@/utils/memoryClassification';
import { Memory } from '@/components/game/memory/types';

/**
 * Custom hook for creating memories with improved classification
 */
export const useMemoryCreation = (sessionId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Generate embedding for text using OpenAI's API via edge function
   */
  const generateEmbedding = async (text: string) => {
    try {
      console.log('[Memory] Starting embedding generation for text:', text);
      
      const response = await supabase.functions.invoke('generate-embedding', {
        body: { text },
      });

      // Clone response data before using it
      const responseData = response.error ? null : { ...response.data };

      if (!response.error && responseData?.embedding) {
        return responseData.embedding;
      }
      
      throw new Error('Invalid embedding format received from API');
    } catch (error) {
      console.error('[Memory] Error generating embedding:', error);
      throw error;
    }
  };

  /**
   * Ensure importance value is within valid range (1-10)
   * If value is invalid, defaults to 5
   */
  const validateImportance = (importance: number | undefined): number => {
    // If importance is undefined or not a number, return default value
    if (typeof importance !== 'number' || isNaN(importance)) {
      console.log('[Memory] Invalid importance value, using default:', importance, '→ 5');
      return 5;
    }
    
    // Clamp value between 1-10 and ensure it's an integer
    const validatedValue = Math.min(Math.max(Math.round(importance), 1), 10);
    
    if (validatedValue !== importance) {
      console.log('[Memory] Adjusted importance value:', importance, '→', validatedValue);
    }
    
    return validatedValue;
  };

  /**
   * Create a new memory entry with embedding
   */
  const createMemory = useMutation({
    mutationFn: async (memory: Omit<Memory, 'id' | 'created_at' | 'updated_at'>) => {
      if (!sessionId) throw new Error('No active session');

      console.log('[Memory] Starting memory creation process:', memory);
      
      try {
        const embedding = await generateEmbedding(memory.content);
        const validatedImportance = validateImportance(memory.importance);
        
        console.log('[Memory] Inserting memory with validated importance:', validatedImportance);
        
        const { data, error } = await supabase
          .from('memories')
          .insert([{ 
            ...memory,
            session_id: sessionId,
            embedding,
            importance: validatedImportance,
            metadata: memory.metadata || {},
          }])
          .select()
          .single();

        if (error) {
          console.error('[Memory] Error in memory creation:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('[Memory] Error in memory creation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', sessionId] });
    },
    onError: (error: any) => {
      console.error('[Memory] Error in memory creation mutation:', error);
      toast({
        title: "Memory Creation Error",
        description: error.message || "Failed to create memory",
        variant: "destructive",
      });
    },
  });

  /**
   * Extract and store memories from content with improved error handling
   */
  const extractMemories = async (content: string) => {
    try {
      if (!sessionId) throw new Error('No active session');

      console.log('[Memory] Processing content for memory extraction:', content);
      
      const memorySegments = processContent(content);
      
      console.log('[Memory] Classified segments:', memorySegments);

      // Create memories for each classified segment
      const results = await Promise.allSettled(
        memorySegments.map(segment => 
          createMemory.mutateAsync({
            session_id: sessionId,
            type: segment.type,
            content: segment.content,
            importance: validateImportance(segment.importance),
            metadata: {},
          })
        )
      );

      // Log results for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[Memory] Failed to create memory ${index}:`, result.reason);
        }
      });

      console.log('[Memory] Memory extraction completed');
    } catch (error) {
      console.error('[Memory] Error extracting memories:', error);
      // Don't throw the error, just log it
      toast({
        title: "Memory System Warning",
        description: "Some memories couldn't be saved, but the game will continue",
        variant: "warning",
      });
    }
  };

  return {
    createMemory: createMemory.mutate,
    extractMemories,
  };
};