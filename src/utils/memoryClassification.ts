/**
 * Utility functions for classifying and processing memories
 */

import { MemoryType } from '@/components/game/memory/types';

/**
 * Interface for classified memory segment
 */
interface MemorySegment {
  content: string;
  type: MemoryType;
  importance: number;
}

/**
 * Enhanced keywords and patterns for memory classification
 * Includes common variations and contextual patterns
 */
const CLASSIFICATION_PATTERNS = {
  location: [
    // Places and structures
    'village', 'town', 'city', 'hamlet', 'castle', 'fortress',
    'forest', 'mountain', 'cave', 'dungeon', 'temple', 'shrine',
    'tavern', 'inn', 'house', 'abode', 'dwelling', 'chamber',
    // Movement and position indicators
    'arrived at', 'entered', 'crossed', 'threshold',
    // Area descriptors
    'location', 'place', 'area', 'region', 'realm', 'domain',
    // Structure parts
    'door', 'gate', 'archway', 'entrance', 'exit',
    // Named locations (common suffixes)
    'mark', 'ville', 'ton', 'bury', 'ford', 'bridge',
    // Room types
    'room', 'hall', 'chamber', 'corridor'
  ],
  character: [
    // Roles and titles
    'elder', 'chief', 'leader', 'merchant', 'guard', 'warrior',
    'wizard', 'priest', 'king', 'queen', 'lord', 'lady',
    'innkeeper', 'shopkeeper', 'figure', 'person',
    // Interaction verbs
    'met', 'spoke', 'talked', 'encountered', 'greeted',
    // Character indicators
    'npc', 'character', 'individual', 'being',
    // Descriptive markers
    'wizened', 'old', 'young', 'mysterious', 'strange',
    // Body parts (when describing characters)
    'eyes', 'hands', 'face', 'voice'
  ],
  event: [
    // Action verbs
    'happened', 'occurred', 'began', 'started', 'ended',
    'attacked', 'defended', 'discovered', 'revealed',
    // Event types
    'battle', 'fight', 'quest', 'mission', 'journey',
    'attack', 'celebration', 'ceremony', 'ritual',
    // State changes
    'transformed', 'changed', 'evolved', 'died', 'appeared',
    // Time indicators
    'suddenly', 'meanwhile', 'after', 'before', 'during',
    // Story markers
    'fate', 'destiny', 'prophecy', 'omen'
  ],
  item: [
    // Common items
    'map', 'scroll', 'book', 'weapon', 'armor', 'shield',
    'potion', 'artifact', 'treasure', 'gold', 'coins',
    // Item states
    'found', 'acquired', 'obtained', 'discovered', 'given',
    // Item types
    'item', 'object', 'tool', 'equipment', 'gear',
    // Magical items
    'magical', 'enchanted', 'cursed', 'blessed', 'ancient',
    // Materials
    'wooden', 'metal', 'golden', 'silver', 'iron'
  ]
};

/**
 * Splits content into coherent segments based on sentence boundaries and clauses
 */
export const splitIntoSegments = (content: string): string[] => {
  // Split on sentence boundaries and semicolons
  const rawSegments = content
    .split(/(?<=[.!?;])\s+/)
    .filter(segment => segment.trim().length > 0);

  // Further split long segments with multiple clauses
  const refinedSegments: string[] = [];
  rawSegments.forEach(segment => {
    if (segment.length > 100) {
      // Split on commas for long segments, but only if they form complete thoughts
      const subSegments = segment
        .split(/,\s*(?=[A-Z])/)
        .filter(s => s.trim().length > 0);
      refinedSegments.push(...subSegments);
    } else {
      refinedSegments.push(segment);
    }
  });

  return refinedSegments;
};

/**
 * Calculates importance score based on enhanced content analysis
 */
export const calculateImportance = (content: string): number => {
  const lowerContent = content.toLowerCase();
  
  const importanceFactors = {
    // Base length factor (longer content might be more important)
    length: Math.min(content.length / 100, 2),
    
    // Explicit importance indicators
    explicitImportance: (
      lowerContent.includes('important') ||
      lowerContent.includes('crucial') ||
      lowerContent.includes('vital') ||
      lowerContent.includes('essential')
    ) ? 2 : 0,
    
    // Emphasis markers
    emphasis: (content.match(/!|\?|must|need|urgent/g) || []).length * 0.5,
    
    // Named entities (proper nouns)
    properNouns: (content.match(/[A-Z][a-z]+/g) || []).length * 0.5,
    
    // Quest-related terms
    questRelevance: (
      lowerContent.includes('quest') ||
      lowerContent.includes('mission') ||
      lowerContent.includes('task') ||
      lowerContent.includes('journey')
    ) ? 1.5 : 0,
    
    // Character introductions
    characterIntro: (
      lowerContent.includes('meet') ||
      lowerContent.includes('introduces') ||
      lowerContent.includes('appears')
    ) ? 1 : 0,
    
    // Location discoveries
    locationDiscovery: (
      lowerContent.includes('discover') ||
      lowerContent.includes('find') ||
      lowerContent.includes('enter') ||
      lowerContent.includes('arrive')
    ) ? 1 : 0
  };

  // Calculate total score and normalize to 1-10 range
  const rawScore = Object.values(importanceFactors).reduce((sum, score) => sum + score, 0);
  return Math.min(Math.max(Math.ceil(rawScore), 1), 10);
};

/**
 * Determines the most appropriate type for a memory segment using enhanced pattern matching
 */
export const classifySegment = (content: string): MemoryType => {
  const lowerContent = content.toLowerCase();
  const typeScores = new Map<MemoryType, number>();

  // Initialize scores
  Object.keys(CLASSIFICATION_PATTERNS).forEach(type => {
    typeScores.set(type as MemoryType, 0);
  });

  // Calculate scores based on keyword matches with context awareness
  Object.entries(CLASSIFICATION_PATTERNS).forEach(([type, patterns]) => {
    patterns.forEach(pattern => {
      // Check for exact word matches using word boundaries
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(lowerContent)) {
        const currentScore = typeScores.get(type as MemoryType) || 0;
        
        // Weight certain patterns higher
        let matchScore = 1;
        if (type === 'location' && /[A-Z][a-z]+/.test(pattern)) {
          matchScore = 2; // Named locations are more important
        }
        if (type === 'character' && lowerContent.includes(`the ${pattern}`)) {
          matchScore = 1.5; // Character introductions
        }
        
        typeScores.set(type as MemoryType, currentScore + matchScore);
      }
    });
  });

  // Find type with highest score
  let maxScore = 0;
  let bestType: MemoryType = 'general';

  typeScores.forEach((score, type) => {
    if (score > maxScore) {
      maxScore = score;
      bestType = type;
    }
  });

  // If no strong match is found (score too low), default to general
  return maxScore >= 0.5 ? bestType : 'general';
};

/**
 * Processes content into classified memory segments with enhanced analysis
 */
export const processContent = (content: string): MemorySegment[] => {
  const segments = splitIntoSegments(content);
  
  return segments.map(segment => {
    const type = classifySegment(segment);
    const importance = calculateImportance(segment);
    
    console.log(`[Memory Classification] Segment: "${segment}"\nType: ${type}, Importance: ${importance}`);
    
    return {
      content: segment.trim(),
      type,
      importance
    };
  });
};