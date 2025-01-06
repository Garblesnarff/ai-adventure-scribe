import { supabase } from '@/integrations/supabase/client';
import { Memory } from '@/types/memory';

/**
 * Interface for formatted memory context
 */
interface FormattedMemoryContext {
  recentEvents: Memory[];
  importantLocations: Memory[];
  keyCharacters: Memory[];
  plotPoints: Memory[];
}

/**
 * Fetches and formats memory context
 * @param sessionId - UUID of the game session
 * @returns Formatted memory context
 */
export const buildMemoryContext = async (
  sessionId: string
): Promise<FormattedMemoryContext> => {
  try {
    console.log('[Context] Fetching memory data:', sessionId);
    
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('session_id', sessionId)
      .order('importance', { ascending: false });

    if (error) throw error;

    // Initialize context structure
    const context: FormattedMemoryContext = {
      recentEvents: [],
      importantLocations: [],
      keyCharacters: [],
      plotPoints: [],
    };

    // Sort memories into categories
    memories?.forEach((memory) => {
      switch (memory.category) {
        case 'event':
          context.recentEvents.push(memory);
          break;
        case 'location':
          context.importantLocations.push(memory);
          break;
        case 'character':
          context.keyCharacters.push(memory);
          break;
        case 'plot':
          context.plotPoints.push(memory);
          break;
        default:
          // For uncategorized memories, add to most relevant category based on content
          if (memory.content.toLowerCase().includes('location')) {
            context.importantLocations.push(memory);
          } else if (memory.content.toLowerCase().includes('character')) {
            context.keyCharacters.push(memory);
          } else {
            context.recentEvents.push(memory);
          }
      }
    });

    return context;
  } catch (error) {
    console.error('[Context] Error building memory context:', error);
    return {
      recentEvents: [],
      importantLocations: [],
      keyCharacters: [],
      plotPoints: [],
    };
  }
};