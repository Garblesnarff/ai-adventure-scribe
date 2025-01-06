/**
 * Utility functions for validating and enhancing context data
 */

import { Campaign, CampaignSetting, ThematicElements } from '@/types/campaign';
import { Memory } from '@/components/game/memory/types';

/**
 * Validates campaign setting data
 * @param setting - Campaign setting to validate
 * @returns Validated setting with defaults if needed
 */
export const validateCampaignSetting = (setting?: Partial<CampaignSetting>): CampaignSetting => {
  return {
    era: setting?.era || 'unknown',
    location: setting?.location || 'unspecified',
    atmosphere: setting?.atmosphere || 'neutral'
  };
};

/**
 * Validates thematic elements
 * @param elements - Thematic elements to validate
 * @returns Validated elements with empty arrays as defaults
 */
export const validateThematicElements = (elements?: Partial<ThematicElements>): ThematicElements => {
  return {
    mainThemes: elements?.mainThemes || [],
    recurringMotifs: elements?.recurringMotifs || [],
    keyLocations: elements?.keyLocations || [],
    importantNPCs: elements?.importantNPCs || []
  };
};

/**
 * Validates and enhances memory importance
 * @param memory - Memory to validate
 * @returns Enhanced memory with calculated importance
 */
export const enhanceMemoryImportance = (memory: Memory): Memory => {
  // Base importance from stored value
  let importance = memory.importance || 0;

  // Enhance importance based on content length and age
  const contentLength = memory.content.length;
  const ageInHours = (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60);

  // Longer content might be more important
  if (contentLength > 200) importance += 1;
  if (contentLength > 500) importance += 1;

  // Recent memories are more important
  if (ageInHours < 24) importance += 2;
  else if (ageInHours < 72) importance += 1;

  // Cap importance at 10
  importance = Math.min(10, importance);

  return {
    ...memory,
    importance
  };
};

/**
 * Sorts memories by importance and recency
 * @param memories - Array of memories to sort
 * @returns Sorted array of memories
 */
export const sortMemoriesByRelevance = (memories: Memory[]): Memory[] => {
  return memories.sort((a, b) => {
    // Primary sort by importance
    const importanceDiff = (b.importance || 0) - (a.importance || 0);
    if (importanceDiff !== 0) return importanceDiff;

    // Secondary sort by recency
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};