/**
 * Hook for handling memory creation operations with improved validation and response handling
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { processContent } from '@/utils/memoryClassification';
import { Memory } from '@/components/game/memory/types';

/**
 * Validates and normalizes importance value to be between 1-10
 */
const validateImportance = (value: number | undefined): number => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 5; // Default importance
  }
  return Math.min(Math.max(Math.round(value), 1), 10);
};

/**
 * Custom hook for creating memories with improved error handling
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

      if (!response.data || response.error) {
        throw new Error(response.error?.message || 'Failed to generate embedding');
      }

      return response.data.embedding;
    } catch (error) {
      console.error('[Memory] Error generating embedding:', error);
      throw error;
    }
  };

  /**
   * Create a new memory entry with embedding and validated importance
   */
  const createMemory = useMutation({
    mutationFn: async (memory: Omit<Memory, 'id' | 'created_at' | 'updated_at'>) => {
      if (!sessionId) throw new Error('No active session');

      try {
        // Validate importance before proceeding
        const validatedImportance = validateImportance(memory.importance);
        console.log('[Memory] Validated importance:', validatedImportance);

        // Generate embedding first
        const embedding = await generateEmbedding(memory.content);
        
        // Prepare validated memory data
        const memoryData = {
          ...memory,
          session_id: sessionId,
          importance: validatedImportance,
          embedding,
          metadata: memory.metadata || {},
        };

        const { data, error } = await supabase
          .from('memories')
          .insert([memoryData])
          .select()
          .single();

        if (error) {
          console.error('[Memory] Error in memory creation:', error);
          throw error;
        }

        return data;
      } catch (error: any) {
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
        title: "Memory System Warning",
        description: "Some memories couldn't be saved, but the game will continue",
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

      // Process each memory segment sequentially to avoid response stream issues
      for (const segment of memorySegments) {
        try {
          await createMemory.mutateAsync({
            session_id: sessionId,
            type: segment.type,
            content: segment.content,
            importance: validateImportance(segment.importance),
            metadata: {},
          });
        } catch (segmentError) {
          console.error(`[Memory] Failed to create memory:`, segmentError);
          // Continue with next segment even if one fails
        }
      }

      console.log('[Memory] Memory extraction completed');
    } catch (error: any) {
      console.error('[Memory] Error extracting memories:', error);
      // Don't throw the error, just log it and show toast
      toast({
        title: "Memory System Warning",
        description: "Some memories couldn't be saved, but the game will continue",
        variant: "destructive",
      });
    }
  };

  return {
    createMemory: createMemory.mutate,
    extractMemories,
  };
};