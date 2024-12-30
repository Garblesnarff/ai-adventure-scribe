import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { Memory } from '@/components/game/memory/types';

/**
 * Custom hook for managing game memories with OpenAI embedding support
 */
export const useMemories = (sessionId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Generate embedding for text using OpenAI's API via our edge function
   */
  const generateEmbedding = async (text: string) => {
    try {
      console.log('[Memory] Starting embedding generation for text:', text);
      
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text },
      });

      if (error) {
        console.error('[Memory] Error from embedding function:', error);
        throw error;
      }
      
      if (!data?.embedding) {
        console.error('[Memory] Invalid embedding format received:', data);
        throw new Error('Invalid embedding format received from API');
      }

      console.log('[Memory] Successfully generated embedding:', data.embedding.substring(0, 100) + '...');
      return data.embedding;
    } catch (error) {
      console.error('[Memory] Error generating embedding:', error);
      throw error;
    }
  };

  /**
   * Parse embedding string to number array
   */
  const parseEmbedding = (embeddingString: string | null): number[] | null => {
    if (!embeddingString) {
      console.log('[Memory] No embedding string provided to parse');
      return null;
    }
    try {
      const parsed = JSON.parse(embeddingString);
      if (!Array.isArray(parsed)) {
        console.error('[Memory] Parsed embedding is not an array:', parsed);
        return null;
      }
      console.log('[Memory] Successfully parsed embedding array of length:', parsed.length);
      return parsed;
    } catch (error) {
      console.error('[Memory] Error parsing embedding:', error);
      return null;
    }
  };

  /**
   * Fetch memories for a specific session
   */
  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      console.log('[Memory] Fetching memories for session:', sessionId);
      
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('session_id', sessionId)
        .order('importance', { ascending: false });

      if (error) {
        console.error('[Memory] Error fetching memories:', error);
        throw error;
      }

      console.log(`[Memory] Retrieved ${data.length} memories`);

      // Convert the embedding strings to number arrays
      return data.map(memory => ({
        ...memory,
        embedding: parseEmbedding(memory.embedding as string),
      })) as Memory[];
    },
    enabled: !!sessionId,
  });

  /**
   * Create a new memory entry with embedding
   */
  const createMemory = useMutation({
    mutationFn: async (memory: Omit<Memory, 'id' | 'created_at' | 'updated_at'>) => {
      if (!sessionId) throw new Error('No active session');

      console.log('[Memory] Starting memory creation process:', memory);
      
      // Generate embedding for the memory content
      console.log('[Memory] Generating embedding for content:', memory.content);
      const embedding = await generateEmbedding(memory.content);
      
      console.log('[Memory] Embedding generated successfully, inserting into database');
      
      const { data, error } = await supabase
        .from('memories')
        .insert([{ 
          ...memory,
          session_id: sessionId,
          embedding,
          metadata: memory.metadata || {}
        }])
        .select()
        .single();

      if (error) {
        console.error('[Memory] Error inserting memory:', error);
        throw error;
      }

      console.log('[Memory] Memory created successfully:', data);
      
      return {
        ...data,
        embedding: parseEmbedding(data.embedding as string),
      } as Memory;
    },
    onSuccess: () => {
      console.log('[Memory] Memory creation mutation completed successfully');
      queryClient.invalidateQueries({ queryKey: ['memories', sessionId] });
      toast({
        title: "Memory Created",
        description: "New memory has been stored successfully",
      });
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
   * Extract and store memories from message content
   */
  const extractMemories = async (content: string, type: Memory['type'] = 'general') => {
    try {
      if (!sessionId) throw new Error('No active session');

      console.log('[Memory] Extracting memories from content:', content);
      
      // Basic importance scoring based on content length and key phrases
      const importance = Math.min(
        Math.ceil(content.length / 100) + 
        (content.toLowerCase().includes('important') ? 1 : 0) +
        (content.toLowerCase().includes('remember') ? 1 : 0),
        5
      );

      console.log('[Memory] Calculated importance score:', importance);

      await createMemory.mutateAsync({
        session_id: sessionId,
        type,
        content,
        importance,
        metadata: {},
      });

      console.log('[Memory] Memory extraction completed successfully');
    } catch (error) {
      console.error('[Memory] Error extracting memories:', error);
      throw error;
    }
  };

  return {
    memories,
    isLoading,
    createMemory: createMemory.mutate,
    extractMemories,
  };
};