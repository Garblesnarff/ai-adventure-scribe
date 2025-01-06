import { supabase } from '@/integrations/supabase/client';
import { Memory, MemoryContext } from '@/types/memory';
import { isValidMemoryType } from '@/components/game/memory/types';

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

    // Build query with filters
    let query = supabase
      .from('memories')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    // Apply time-based filtering
    if (options.timeframe === 'recent') {
      const recentTime = new Date();
      recentTime.setHours(recentTime.getHours() - 1);
      query = query.gte('created_at', recentTime.toISOString());
    }

    // Apply importance filtering
    if (options.importance) {
      query = query.gte('importance', options.importance);
    }

    // Apply limit
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

    // Process and categorize memories
    memories?.forEach(memory => {
      // Validate memory type
      const validatedType = isValidMemoryType(memory.type) ? memory.type : 'general';
      
      const memoryObj: Memory = {
        id: memory.id,
        type: validatedType,
        content: memory.content,
        importance: calculateImportance(memory),
        created_at: memory.created_at || new Date().toISOString(),
        updated_at: memory.updated_at || new Date().toISOString(),
        session_id: memory.session_id,
        metadata: memory.metadata || {},
        embedding: memory.embedding,
      };

      // Categorize memory based on validated type
      switch (validatedType) {
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

/**
 * Calculates memory importance based on various factors
 * @param memory - Memory object to calculate importance for
 * @returns Calculated importance score
 */
const calculateImportance = (memory: any): number => {
  let importance = memory.importance || 0;
  
  // Factor in metadata significance if available
  if (typeof memory.metadata === 'object' && memory.metadata !== null) {
    const metadata = memory.metadata as Record<string, any>;
    if (typeof metadata.significance === 'number') {
      importance += metadata.significance;
    }
  }

  // Factor in recency
  const ageInHours = (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60);
  if (ageInHours < 1) importance += 3;
  else if (ageInHours < 24) importance += 2;
  else if (ageInHours < 72) importance += 1;

  // Cap importance at 10
  return Math.min(10, importance);
};