import { supabase } from '@/integrations/supabase/client';
import { Memory, MemoryType } from '@/types/memory';

/**
 * Interface for formatted memory context
 */
export interface MemoryContextData {
  recentEvents: Memory[];
  importantLocations: Memory[];
  keyCharacters: Memory[];
  plotPoints: Memory[];
  generalMemories: Memory[];
}

/**
 * Fetches and formats memory context
 * @param sessionId - UUID of the game session
 * @returns Formatted memory context or null if not found
 */
export const buildMemoryContext = async (
  sessionId: string
): Promise<MemoryContextData | null> => {
  try {
    console.log('[Memory] Fetching memories for session:', sessionId);
    
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('session_id', sessionId)
      .order('importance', { ascending: false });

    if (error) throw error;
    
    const context: MemoryContextData = {
      recentEvents: [],
      importantLocations: [],
      keyCharacters: [],
      plotPoints: [],
      generalMemories: [],
    };

    memories?.forEach(memory => {
      const typedMemory = {
        ...memory,
        type: memory.type as MemoryType
      };

      switch (typedMemory.type) {
        case 'event':
          context.recentEvents.push(typedMemory);
          break;
        case 'location':
          context.importantLocations.push(typedMemory);
          break;
        case 'character':
          context.keyCharacters.push(typedMemory);
          break;
        case 'plot':
          context.plotPoints.push(typedMemory);
          break;
        default:
          context.generalMemories.push(typedMemory);
      }
    });

    return context;
  } catch (error) {
    console.error('[Memory] Error building memory context:', error);
    return null;
  }
};