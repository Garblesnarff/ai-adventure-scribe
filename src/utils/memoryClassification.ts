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
 * Keywords and patterns for memory classification
 */
const CLASSIFICATION_PATTERNS = {
  location: [
    'village', 'town', 'city', 'hamlet', 'castle', 'forest', 'mountain',
    'arrived at', 'entered', 'location', 'place', 'area', 'region',
    'temple', 'dungeon', 'cave', 'inn', 'tavern'
  ],
  character: [
    'met', 'spoke', 'talked', 'npc', 'character', 'person', 'merchant',
    'guard', 'warrior', 'wizard', 'priest', 'king', 'queen', 'lord',
    'lady', 'innkeeper', 'shopkeeper'
  ],
  event: [
    'happened', 'occurred', 'event', 'battle', 'fight', 'quest',
    'mission', 'attack', 'celebration', 'ceremony', 'ritual',
    'began', 'started', 'ended', 'discovered'
  ],
  item: [
    'found', 'acquired', 'item', 'weapon', 'armor', 'potion',
    'scroll', 'book', 'artifact', 'treasure', 'gold', 'coins',
    'equipment', 'tool', 'magical item'
  ]
};

/**
 * Splits content into coherent segments based on sentence boundaries
 */
export const splitIntoSegments = (content: string): string[] => {
  return content
    .split(/(?<=[.!?])\s+/)
    .filter(segment => segment.trim().length > 0);
};

/**
 * Calculates importance score based on content analysis
 */
export const calculateImportance = (content: string): number => {
  const importanceFactors = {
    length: Math.min(content.length / 100, 2),
    keywords: content.toLowerCase().includes('important') ? 1 : 0,
    emphasis: (content.match(/!|\?|vital|crucial|essential/g) || []).length,
    proper_nouns: (content.match(/[A-Z][a-z]+/g) || []).length * 0.5
  };

  return Math.min(
    Math.ceil(
      Object.values(importanceFactors).reduce((sum, score) => sum + score, 0)
    ),
    5
  );
};

/**
 * Determines the most appropriate type for a memory segment
 */
export const classifySegment = (content: string): MemoryType => {
  const lowerContent = content.toLowerCase();
  const typeScores = new Map<MemoryType, number>();

  // Initialize scores
  Object.keys(CLASSIFICATION_PATTERNS).forEach(type => {
    typeScores.set(type as MemoryType, 0);
  });

  // Calculate scores based on keyword matches
  Object.entries(CLASSIFICATION_PATTERNS).forEach(([type, patterns]) => {
    patterns.forEach(pattern => {
      if (lowerContent.includes(pattern.toLowerCase())) {
        typeScores.set(
          type as MemoryType,
          (typeScores.get(type as MemoryType) || 0) + 1
        );
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

  return bestType;
};

/**
 * Processes content into classified memory segments
 */
export const processContent = (content: string): MemorySegment[] => {
  const segments = splitIntoSegments(content);
  
  return segments.map(segment => ({
    content: segment.trim(),
    type: classifySegment(segment),
    importance: calculateImportance(segment)
  }));
};