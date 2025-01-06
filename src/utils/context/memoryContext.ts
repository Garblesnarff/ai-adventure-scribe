import { supabase } from '@/integrations/supabase/client';
import { Memory, MemoryContext, MemoryType } from '@/types/memory';

/**
 * Interface for memory filtering options
 */
interface MemoryFilterOptions {
  timeframe?: 'recent' | 'all';
  importance?: number;
  limit?: number;
}

/**
 * Fetches and formats memory context with enhanced filtering and sorting
 * @param sessionId - UUID of the game session
 * @param options - Optional filtering parameters
 * @returns Formatted memory context or null if error
 */
export const buildMemoryContext = async (
  sessionId: string,
  options: MemoryFilterOptions = {}
): Promise<MemoryContext | null> => {
  try {
    console.log('[Context] Fetching memories for session:', sessionId);

    let query = supabase
      .from('memories')
      .select('*')
      .eq('session_id', sessionId)
      .order('importance', { ascending: false });

    // Apply time-based filtering
    if (options.timeframe === 'recent') {
      const recentTime = new Date();
      recentTime.setHours(recentTime.getHours() - 1); // Last hour
      query = query.gte('created_at', recentTime.toISOString());
    }

    // Apply importance filtering
    if (options.importance) {
      query = query.gte('importance', options.importance);
    }

    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data: memories, error } = await query;

    if (error) throw error;

    // Initialize context categories
    const context: MemoryContext = {
      recentEvents: [],
      importantLocations: [],
      keyCharacters: [],
      plotPoints: [],
    };

    // Sort and categorize memories
    memories?.forEach(memory => {
      const memoryObj: Memory = {
        id: memory.id,
        type: memory.type as MemoryType,
        content: memory.content,
        importance: memory.importance || 0,
        created_at: memory.created_at || new Date().toISOString(),
        updated_at: memory.updated_at || new Date().toISOString(), // Add the missing updated_at field
        session_id: memory.session_id,
        metadata: memory.metadata || {},
        embedding: memory.embedding,
      };

      switch (memory.type) {
        case 'event':
          context.recentEvents.push(memoryObj);
          break;
        case 'location':
          context.importantLocations.push(memoryObj);
          break;
        case 'character':
          context.keyCharacters.push(memoryObj);
          break;
        case 'plot':
          context.plotPoints.push(memoryObj);
          break;
      }
    });

    // Sort each category by importance
    Object.values(context).forEach(category => {
      category.sort((a, b) => (b.importance || 0) - (a.importance || 0));
    });

    return context;
  } catch (error) {
    console.error('[Context] Error building memory context:', error);
    return null;
  }
};