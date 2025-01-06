import { Memory } from '@/components/game/memory/types';

/**
 * Interface for categorized memory context
 */
export interface MemoryContext {
  recentEvents: Memory[];
  importantLocations: Memory[];
  keyCharacters: Memory[];
  plotPoints: Memory[];
}

/**
 * Interface for memory with relevance scoring
 */
export interface ScoredMemory {
  memory: Memory;
  relevanceScore: number;
}

/**
 * Interface for memory filtering options
 */
export interface MemoryFilter {
  category?: string;
  importance?: number;
  timeframe?: 'recent' | 'all';
}