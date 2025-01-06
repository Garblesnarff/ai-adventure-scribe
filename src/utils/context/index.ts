import { buildCampaignContext } from './campaignContext';
import { buildCharacterContext } from './characterContext';
import { buildMemoryContext } from './memoryContext';
import { buildEnhancedGameContext } from './contextEnhancement';
import { Campaign } from '@/types/campaign';

export { buildCampaignContext } from './campaignContext';
export { buildCharacterContext } from './characterContext';
export { buildMemoryContext } from './memoryContext';

/**
 * Builds complete game context by combining campaign, character, and memory data
 * @param campaignId - UUID of the campaign
 * @param characterId - UUID of the character
 * @param sessionId - UUID of the game session
 * @returns Combined context object or null if any context fails to build
 */
export const buildGameContext = async (
  campaignId: string,
  characterId: string,
  sessionId: string
) => {
  try {
    console.log('[Context] Building complete game context');
    
    const [campaignContext, characterContext, memoryContext] = await Promise.all([
      buildCampaignContext(campaignId),
      buildCharacterContext(characterId),
      buildMemoryContext(sessionId),
    ]);

    // Validate that all contexts were built successfully
    if (!campaignContext || !characterContext || !memoryContext) {
      console.error('[Context] One or more contexts failed to build');
      return null;
    }

    // Convert FormattedCampaignContext to Campaign type
    const campaign: Campaign = {
      id: campaignId,
      name: campaignContext.basicInfo.name,
      description: campaignContext.basicInfo.description,
      genre: campaignContext.basicInfo.genre,
      setting: campaignContext.setting,
      thematic_elements: {
        mainThemes: [],
        recurringMotifs: [],
        keyLocations: [],
        importantNPCs: []
      },
      status: campaignContext.basicInfo.status
    };

    // Build enhanced context with all available data
    const enhancedContext = buildEnhancedGameContext(
      campaign,
      characterContext,
      memoryContext.recentEvents || []
    );

    console.log('[Context] Successfully built enhanced game context');
    return enhancedContext;
  } catch (error) {
    console.error('[Context] Error building game context:', error);
    return null;
  }
};