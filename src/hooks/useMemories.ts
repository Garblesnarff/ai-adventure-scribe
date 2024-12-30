import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

/**
 * Interface for memory data structure
 */
interface Memory {
  id: string;
  session_id: string;
  type: 'location' | 'character' | 'event' | 'item' | 'general';
  content: string;
  importance: number;
  embedding?: number[];
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Custom hook for managing game memories with embedding support
 */
export const useMemories = (sessionId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Generate embedding for text using our edge function
   */
  const generateEmbedding = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text },
      });

      if (error) throw error;
      return data.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  };

  /**
   * Fetch memories for a specific session
   */
  const { data: memories, isLoading } = useQuery({
    queryKey: ['memories', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('session_id', sessionId)
        .order('importance', { ascending: false });

      if (error) {
        console.error('Error fetching memories:', error);
        throw error;
      }

      return data as Memory[];
    },
    enabled: !!sessionId,
  });

  /**
   * Create a new memory entry with embedding
   */
  const createMemory = useMutation({
    mutationFn: async (memory: Omit<Memory, 'id' | 'created_at'>) => {
      // Generate embedding for the memory content
      const embedding = await generateEmbedding(memory.content);
      
      const { data, error } = await supabase
        .from('memories')
        .insert([{ ...memory, embedding }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', sessionId] });
    },
    onError: (error) => {
      console.error('Error creating memory:', error);
      toast({
        title: "Error",
        description: "Failed to create memory",
        variant: "destructive",
      });
    },
  });

  /**
   * Extract and store memories from message content
   */
  const extractMemories = async (content: string, type: Memory['type'] = 'general') => {
    try {
      // Basic importance scoring based on content length and key phrases
      const importance = Math.min(
        Math.ceil(content.length / 100) + 
        (content.toLowerCase().includes('important') ? 1 : 0) +
        (content.toLowerCase().includes('remember') ? 1 : 0),
        5
      );

      await createMemory.mutateAsync({
        session_id: sessionId!,
        type,
        content,
        importance,
        metadata: {},
      });
    } catch (error) {
      console.error('Error extracting memories:', error);
    }
  };

  return {
    memories,
    isLoading,
    createMemory: createMemory.mutate,
    extractMemories,
  };
};