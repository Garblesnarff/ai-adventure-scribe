/**
 * Utility functions for calculating memory importance
 */

interface ImportanceFactors {
  namedEntities: number;
  questRelevance: number;
  characterIntroduction: number;
  locationDescription: number;
  eventSignificance: number;
  itemRarity: number;
}

/**
 * Calculates importance score based on content analysis
 */
export const calculateImportance = (content: string): number => {
  const factors = analyzeContent(content);
  return computeImportanceScore(factors);
};

/**
 * Analyzes content for various importance factors
 */
const analyzeContent = (content: string): ImportanceFactors => {
  const lowerContent = content.toLowerCase();
  
  return {
    // Named entities (proper nouns) carry high importance
    namedEntities: (content.match(/[A-Z][a-z]+/g) || []).length * 2,
    
    // Quest-related content is highly important
    questRelevance: containsQuestTerms(lowerContent) ? 3 : 0,
    
    // Character introductions are significant
    characterIntroduction: containsCharacterIntro(lowerContent) ? 2 : 0,
    
    // Location descriptions add importance
    locationDescription: containsLocationDesc(lowerContent) ? 2 : 0,
    
    // Significant events are important
    eventSignificance: containsSignificantEvent(lowerContent) ? 2 : 0,
    
    // Rare or magical items are important
    itemRarity: containsRareItem(lowerContent) ? 2 : 0,
  };
};

/**
 * Computes final importance score from factors
 */
const computeImportanceScore = (factors: ImportanceFactors): number => {
  const rawScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
  return Math.min(Math.max(Math.ceil(rawScore), 1), 10);
};

// Helper functions for content analysis
const containsQuestTerms = (content: string): boolean => {
  return /\b(quest|mission|task|journey|adventure)\b/i.test(content);
};

const containsCharacterIntro = (content: string): boolean => {
  return /\b(meet|encounter|approach|greet)\b/i.test(content);
};

const containsLocationDesc = (content: string): boolean => {
  return /\b(enter|arrive|reach|discover|find)\b/i.test(content);
};

const containsSignificantEvent = (content: string): boolean => {
  return /\b(battle|war|ceremony|prophecy|revelation)\b/i.test(content);
};

const containsRareItem = (content: string): boolean => {
  return /\b(magical|ancient|legendary|rare|unique)\b/i.test(content);
};