import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { Memory } from '@/components/game/memory/types';
import { MEMORY_CATEGORIES } from '@/components/game/memory/memoryConstants';

/**
 * Determine memory type based on content analysis
 * @param content - The memory content to analyze
 * @returns The classified memory type
 */
const classifyMemoryType = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  // Location indicators
  if (lowerContent.includes('arrived at') || 
      lowerContent.includes('entered') || 
      lowerContent.includes('location') ||
      lowerContent.includes('place') ||
      lowerContent.includes('area')) {
    return 'location';
  }
  
  // Character indicators
  if (lowerContent.includes('met') || 
      lowerContent.includes('spoke with') || 
      lowerContent.includes('talked to') ||
      lowerContent.includes('npc') ||
      lowerContent.includes('character')) {
    return 'character';
  }
  
  // Event indicators
  if (lowerContent.includes('happened') || 
      lowerContent.includes('occurred') || 
      lowerContent.includes('event') ||
      lowerContent.includes('battle') ||
      lowerContent.includes('fight')) {
    return 'event';
  }
  
  // Item indicators
  if (lowerContent.includes('found') || 
      lowerContent.includes('acquired') || 
      lowerContent.includes('item') ||
      lowerContent.includes('weapon') ||
      lowerContent.includes('armor')) {
    return 'item';
  }
  
  // Default to general if no specific category is detected
  return 'general';
};

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

      console.log('[Memory] Successfully generated embedding');
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
      return JSON.parse(embeddingString);
    } catch (error) {
      console.error('[Memory] Error parsing embedding:', error);
      return null;
    }
  };

  /**
   * Fetch memories for a specific session with improved error handling
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Memory] Error fetching memories:', error);
        throw error;
      }

      console.log(`[Memory] Retrieved ${data.length} memories`);
      return data.map(memory => ({
        ...memory,
        embedding: parseEmbedding(memory.embedding),
      }));
    },
    enabled: !!sessionId,
  });

  /**
   * Create a new memory entry with embedding and improved validation
   */
  const createMemory = useMutation({
    mutationFn: async (memory: Omit<Memory, 'id' | 'created_at' | 'updated_at'>) => {
      if (!sessionId) throw new Error('No active session');

      console.log('[Memory] Starting memory creation process:', memory);
      
      // Generate embedding for the memory content
      const embedding = await generateEmbedding(memory.content);
      console.log('[Memory] Embedding generated successfully');
      
      // Determine memory type if not provided
      const type = memory.type || classifyMemoryType(memory.content);
      console.log('[Memory] Classified memory type:', type);
      
      // Insert memory into database
      const { data, error } = await supabase
        .from('memories')
        .insert([{ 
          ...memory,
          type,
          session_id: sessionId,
          embedding,
          metadata: memory.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[Memory] Error inserting memory:', error);
        throw error;
      }

      console.log('[Memory] Memory created successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('[Memory] Memory creation mutation completed successfully');
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
   * Extract and store memories from message content with improved classification
   */
  const extractMemories = async (content: string, suggestedType?: string) => {
    try {
      if (!sessionId) throw new Error('No active session');

      console.log('[Memory] Extracting memories from content:', content);
      
      // Use suggested type or classify based on content
      const type = suggestedType || classifyMemoryType(content);
      console.log('[Memory] Using memory type:', type);
      
      // Basic importance scoring
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