/**
 * Hook for handling memory creation operations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { processContent } from '@/utils/memoryClassification';
import { Memory, MemoryType, isValidMemoryType } from '@/components/game/memory/types';

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
   * Validates memory data before creation
   */
  const validateMemory = (memory: Partial<Memory>): boolean => {
    if (!memory.content || typeof memory.content !== 'string') {
      console.error('[Memory] Invalid content:', memory.content);
      return false;
    }

    if (!isValidMemoryType(memory.type)) {
      console.error('[Memory] Invalid memory type:', memory.type);
      return false;
    }

    if (memory.importance && (memory.importance < 1 || memory.importance > 5)) {
      console.error('[Memory] Invalid importance score:', memory.importance);
      return false;
    }

    return true;
  };

  /**
   * Create a new memory entry with embedding
   */
  const createMemory = useMutation({
    mutationFn: async (memory: Omit<Memory, 'id' | 'created_at' | 'updated_at'>) => {
      if (!sessionId) throw new Error('No active session');

      console.log('[Memory] Starting memory creation process:', memory);
      
      if (!validateMemory(memory)) {
        throw new Error('Invalid memory data');
      }

      const embedding = await generateEmbedding(memory.content);
      
      const { data, error } = await supabase
        .from('memories')
        .insert([{ 
          ...memory,
          session_id: sessionId,
          embedding,
          metadata: memory.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

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
        if (!isValidMemoryType(segment.type)) {
          console.warn('[Memory] Skipping segment with invalid type:', segment);
          continue;
        }

        await createMemory.mutateAsync({
          session_id: sessionId,
          type: segment.type,
          content: segment.content,
          importance: segment.importance,
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