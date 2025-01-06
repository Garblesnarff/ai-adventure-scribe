import { Campaign } from '@/types/campaign';
import { Character } from '@/types/character';
import { Memory } from '@/types/memory';
import { buildCampaignContext } from './campaignContext';
import { buildCharacterContext } from './characterContext';
import { buildMemoryContext } from './memoryContext';

/**
 * Interface for complete game context
 */
interface GameContext {
  campaign: {
    basic: {
      name: string;
      description?: string;
      genre?: string;
      status: string;
    };
    setting: {
      era: string;
      location: string;
      atmosphere: string;
    };
    themes: {
      mainThemes: string[];
      recurringMotifs: string[];
      keyLocations: string[];
      importantNPCs: string[];
    };
  };
  character?: {
    basic: {
      name: string;
      race: string;
      class: string;
      level: number;
    };
    stats: {
      health: {
        current: number;
        max: number;
        temporary: number;
      };
      armorClass: number;
      abilities: Record<string, number>;
    };
    equipment: Array<{
      name: string;
      type: string;
      equipped: boolean;
    }>;
  };
  memories: {
    recent: Memory[];
    locations: Memory[];
    characters: Memory[];
    plot: Memory[];
  };
}

/**
 * Builds a complete game context by combining campaign, character, and memory data
 * @param campaignId - UUID of the campaign
 * @param characterId - UUID of the character
 * @param sessionId - UUID of the game session
 * @returns Combined context object or null if critical data is missing
 */
export const buildGameContext = async (
  campaignId: string,
  characterId: string,
  sessionId: string
): Promise<GameContext | null> => {
  try {
    console.log('[Context] Building complete game context');
    
    // Fetch all contexts in parallel
    const [campaignContext, characterContext, memoryContext] = await Promise.all([
      buildCampaignContext(campaignId),
      buildCharacterContext(characterId),
      buildMemoryContext(sessionId, { timeframe: 'recent', limit: 5 }),
    ]);

    // Validate critical campaign data
    if (!campaignContext) {
      console.error('[Context] Failed to build campaign context');
      return null;
    }

    // Build unified context
    return {
      campaign: {
        basic: {
          name: campaignContext.basicInfo.name,
          description: campaignContext.basicInfo.description,
          genre: campaignContext.basicInfo.genre,
          status: campaignContext.basicInfo.status || 'active',
        },
        setting: {
          era: campaignContext.setting.era || 'unspecified',
          location: campaignContext.setting.location || 'unknown',
          atmosphere: campaignContext.setting.atmosphere || 'neutral',
        },
        themes: {
          mainThemes: campaignContext.thematicElements.mainThemes || [],
          recurringMotifs: campaignContext.thematicElements.recurringMotifs || [],
          keyLocations: campaignContext.thematicElements.keyLocations || [],
          importantNPCs: campaignContext.thematicElements.importantNPCs || [],
        },
      },
      character: characterContext ? {
        basic: {
          name: characterContext.basicInfo.name,
          race: characterContext.basicInfo.race,
          class: characterContext.basicInfo.class,
          level: characterContext.basicInfo.level || 1,
        },
        stats: {
          health: {
            current: characterContext.stats.currentHp,
            max: characterContext.stats.maxHp,
            temporary: 0, // Default to 0 if not provided
          },
          armorClass: characterContext.stats.armorClass,
          abilities: {
            strength: characterContext.stats.strength,
            dexterity: characterContext.stats.dexterity,
            constitution: characterContext.stats.constitution,
            intelligence: characterContext.stats.intelligence,
            wisdom: characterContext.stats.wisdom,
            charisma: characterContext.stats.charisma,
          },
        },
        equipment: characterContext.equipment.map(item => ({
          name: item.name,
          type: item.type,
          equipped: item.equipped,
        })),
      } : undefined,
      memories: {
        recent: memoryContext?.recentEvents.slice(0, 5) || [],
        locations: memoryContext?.importantLocations,
        characters: memoryContext?.keyCharacters,
        plot: memoryContext?.plotPoints,
      },
    };
  } catch (error) {
    console.error('[Context] Error building game context:', error);
    return null;
  }
};

/**
 * Validates that a context object has all required fields
 * @param context - Context object to validate
 * @returns Boolean indicating if context is valid
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

/**
 * Creates a default context with fallback values
 * @returns Default game context
 */
export const createDefaultContext = (): GameContext => ({
  campaign: {
    basic: {
      name: 'Unnamed Campaign',
      status: 'active',
    },
    setting: {
      era: 'unspecified',
      location: 'unknown',
      atmosphere: 'neutral',
    },
    themes: {
      mainThemes: [],
      recurringMotifs: [],
      keyLocations: [],
      importantNPCs: [],
    },
  },
  memories: {
    recent: [],
    locations: [],
    characters: [],
    plot: [],
  },
});
