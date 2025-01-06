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
      
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text },
      });

      if (error) throw error;
      
      if (!data?.embedding) {
        throw new Error('Invalid embedding format received from API');
      }

      return data.embedding;
    } catch (error) {
      console.error('[Memory] Error generating embedding:', error);
      throw error;
    }
  };

  /**
   * Ensure importance value is within valid range (1-10)
   */
  const validateImportance = (importance: number | undefined): number => {
    if (typeof importance !== 'number') return 5; // Default importance
    return Math.min(Math.max(Math.round(importance), 1), 10); // Clamp between 1-10
  };

  /**
   * Create a new memory entry with embedding
   */
  const createMemory = useMutation({
    mutationFn: async (memory: Omit<Memory, 'id' | 'created_at' | 'updated_at'>) => {
      if (!sessionId) throw new Error('No active session');

      console.log('[Memory] Starting memory creation process:', memory);
      
      const embedding = await generateEmbedding(memory.content);
      const validatedImportance = validateImportance(memory.importance);
      
      const { data, error } = await supabase
        .from('memories')
        .insert([{ 
          ...memory,
          session_id: sessionId,
          embedding,
          importance: validatedImportance,
          metadata: memory.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[Memory] Error in memory creation:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', sessionId] });
    },
    onError: (error) => {
      console.error('[Memory] Error in memory creation mutation:', error);
      toast({
        title: "Error",
        description: "Failed to create memory: " + error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Extract and store memories from content with improved classification
   */
  const extractMemories = async (content: string) => {
    try {
      if (!sessionId) throw new Error('No active session');

      console.log('[Memory] Processing content for memory extraction:', content);
      
      const memorySegments = processContent(content);
      
      console.log('[Memory] Classified segments:', memorySegments);

      // Create memories for each classified segment
      for (const segment of memorySegments) {
        await createMemory.mutateAsync({
          session_id: sessionId,
          type: segment.type,
          content: segment.content,
          importance: validateImportance(segment.importance),
          metadata: {},
        });
      }

      console.log('[Memory] Memory extraction completed successfully');
    } catch (error) {
      console.error('[Memory] Error extracting memories:', error);
      throw error;
    }
  };

  return {
    createMemory: createMemory.mutate,
    extractMemories,
  };
};