import { supabase } from '@/integrations/supabase/client';
import { Memory, MemoryType, isValidMemoryType } from '@/components/game/memory/types';
import { MemoryContext } from '@/types/memory';

/**
 * Builds memory context for a given session
 * @param sessionId - UUID of the game session
 * @returns Formatted memory context or null if not found
 */
export const buildMemoryContext = async (
  sessionId: string
): Promise<MemoryContext | null> => {
  try {
    console.log('[Memory] Fetching memories for session:', sessionId);
    
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('session_id', sessionId)
      .order('importance', { ascending: false });

    if (error) throw error;
    
    const context: MemoryContext = {
      recentEvents: [],
      importantLocations: [],
      keyCharacters: [],
      plotPoints: [],
    };

    memories?.forEach(memory => {
      if (!memory.type || !isValidMemoryType(memory.type)) return;

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
      }
    });

    return context;
  } catch (error) {
    console.error('[Memory] Error building memory context:', error);
    return null;
  }
};