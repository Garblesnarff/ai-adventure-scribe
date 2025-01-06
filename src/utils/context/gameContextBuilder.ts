import { Campaign } from '@/types/campaign';
import { Character } from '@/types/character';
import { Memory } from '@/types/memory';
import { buildCampaignContext } from './campaignContext';
import { buildCharacterContext } from './characterContext';
import { buildMemoryContext } from './memoryContext';
import { validateGameContext } from './contextValidation';
import { createDefaultContext } from './contextDefaults';

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
    thematicElements: {
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
    currentLocation?: {
      name: string;
      description?: string;
      type?: string;
    };
    activeNPCs?: Array<{
      name: string;
      type?: string;
      status: string;
    }>;
  };
}

/**
 * Builds a complete game context by combining campaign, character, and memory data
 */
export const buildGameContext = async (
  campaignId: string,
  characterId: string,
  sessionId: string
): Promise<GameContext | null> => {
  try {
    console.log('[Context] Building complete game context');
    
    // Fetch all contexts in parallel with error handling
    const [campaignContext, characterContext, memoryContext] = await Promise.allSettled([
      buildCampaignContext(campaignId),
      buildCharacterContext(characterId),
      buildMemoryContext(sessionId, { 
        timeframe: 'recent', 
        limit: 5,
        includeLocations: true,
        includeNPCs: true 
      }),
    ]);

    // Handle potential failures in context building
    const context: GameContext = {
      campaign: campaignContext.status === 'fulfilled' && campaignContext.value
        ? {
            basic: {
              name: campaignContext.value.basicInfo.name,
              description: campaignContext.value.basicInfo.description,
              genre: campaignContext.value.basicInfo.genre,
              status: campaignContext.value.basicInfo.status || 'active',
            },
            setting: {
              era: campaignContext.value.setting.era || 'unspecified',
              location: campaignContext.value.setting.location || 'unknown',
              atmosphere: campaignContext.value.setting.atmosphere || 'neutral',
            },
            thematicElements: campaignContext.value.thematicElements,
          }
        : createDefaultContext().campaign,

      character: characterContext.status === 'fulfilled' && characterContext.value
        ? {
            basic: {
              name: characterContext.value.basicInfo.name,
              race: characterContext.value.basicInfo.race,
              class: characterContext.value.basicInfo.class,
              level: characterContext.value.basicInfo.level || 1,
            },
            stats: {
              health: {
                current: characterContext.value.stats.currentHp,
                max: characterContext.value.stats.maxHp,
                temporary: characterContext.value.stats.temporaryHp || 0,
              },
              armorClass: characterContext.value.stats.armorClass,
              abilities: {
                strength: characterContext.value.stats.strength,
                dexterity: characterContext.value.stats.dexterity,
                constitution: characterContext.value.stats.constitution,
                intelligence: characterContext.value.stats.intelligence,
                wisdom: characterContext.value.stats.wisdom,
                charisma: characterContext.value.stats.charisma,
              },
            },
            equipment: characterContext.value.equipment.map(item => ({
              name: item.name,
              type: item.type,
              equipped: item.equipped,
            })),
          }
        : undefined,

      memories: memoryContext.status === 'fulfilled' && memoryContext.value
        ? {
            recent: memoryContext.value.recentEvents.slice(0, 5),
            locations: memoryContext.value.importantLocations,
            characters: memoryContext.value.keyCharacters,
            plot: memoryContext.value.plotPoints,
            currentLocation: memoryContext.value.currentLocation
              ? {
                  name: memoryContext.value.currentLocation.name,
                  description: memoryContext.value.currentLocation.description,
                  type: memoryContext.value.currentLocation.location_type,
                }
              : undefined,
            activeNPCs: memoryContext.value.activeNPCs?.map(npc => ({
              name: npc.name,
              type: npc.class || npc.race,
              status: npc.personality || 'neutral',
            })),
          }
        : createDefaultContext().memories,
    };

    // Validate the built context
    if (!validateGameContext(context)) {
      console.error('[Context] Invalid game context structure');
      return createDefaultContext();
    }

    return context;
  } catch (error) {
    console.error('[Context] Error building game context:', error);
    return createDefaultContext();
  }
};