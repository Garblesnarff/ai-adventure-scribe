export { buildCampaignContext } from './campaignContext';
export { buildCharacterContext } from './characterContext';
export { buildMemoryContext } from './memoryContext';

/**
 * Builds complete game context by combining campaign, character, and memory data
 */
export const buildGameContext = async (
  campaignId: string,
  characterId: string,
  sessionId: string
) => {
  const [campaignContext, characterContext, memoryContext] = await Promise.all([
    buildCampaignContext(campaignId),
    buildCharacterContext(characterId),
    buildMemoryContext(sessionId),
  ]);

  return {
    campaign: campaignContext,
    character: characterContext,
    memories: memoryContext,
  };
};