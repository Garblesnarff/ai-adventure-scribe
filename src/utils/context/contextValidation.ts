import { GameContext } from '@/types/game';

/**
 * Validates that a context object has all required fields
 */
export const validateGameContext = (context: GameContext): boolean => {
  if (!context.campaign?.basic?.name) {
    console.error('[Context] Missing campaign name');
    return false;
  }

  if (!context.campaign?.setting) {
    console.error('[Context] Missing campaign setting');
    return false;
  }

  if (!context.campaign?.thematicElements) {
    console.error('[Context] Missing thematic elements');
    return false;
  }

  // Character context is optional but if present must be complete
  if (context.character) {
    if (!context.character.basic?.name || 
        !context.character.basic?.class || 
        !context.character.basic?.race) {
      console.error('[Context] Incomplete character data');
      return false;
    }

    if (!context.character.stats?.health || 
        context.character.stats.armorClass === undefined) {
      console.error('[Context] Missing character stats');
      return false;
    }
  }

  // Memories array should always exist even if empty
  if (!Array.isArray(context.memories?.recent)) {
    console.error('[Context] Missing memories array');
    return false;
  }

  return true;
};