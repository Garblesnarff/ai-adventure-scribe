import { Database } from './database.types';

export type { Database };

export type Json = Database['public']['CompositeTypes']['json'];
export type Tables = Database['public']['Tables'];
export type TablesInsert = Database['public']['Tables'];
export type TablesUpdate = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Export table row types
export type CampaignRow = Tables['campaigns']['Row'];
export type CharacterRow = Tables['characters']['Row'];
export type GameSessionRow = Tables['game_sessions']['Row'];
export type MemoryRow = Tables['memories']['Row'];
export type DialogueHistoryRow = Tables['dialogue_history']['Row'];

// Interface for campaign setting details
export interface CampaignSetting {
  era: string;              // e.g., "1920s", "medieval", "future"
  location: string;         // e.g., "Ravenswood", "New Erebo"
  atmosphere: string;       // e.g., "horror", "high fantasy"
}

/**
 * Interface for campaign thematic elements
 */
export interface ThematicElements {
  mainThemes: string[];     // e.g., ["reflection", "madness"]
  recurringMotifs: string[];// e.g., ["mirrors", "shadows"]
  keyLocations: string[];   // e.g., ["Blackstone Mansion"]
  importantNPCs: string[];  // e.g., ["Edward Blackstone"]
}

/**
 * Interface for complete campaign data
 */
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  difficulty_level?: string;
  campaign_length?: 'one-shot' | 'short' | 'full';
  tone?: 'serious' | 'humorous' | 'gritty';
  setting: CampaignSetting;
  thematic_elements: ThematicElements;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

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

/**
 * Interface for agent execution results
 */
export interface AgentResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Interface for agent tasks
 */
export interface AgentTask {
  id: string;
  description: string;
  expectedOutput: string;
  context?: Record<string, any>;
}

/**
 * Types of agents available in the system
 */
export enum AgentType {
  DungeonMaster = 'dungeon_master',
  Narrator = 'narrator',
  RulesInterpreter = 'rules_interpreter'
}

/**
 * Base interface for all agents in the system
 */
export interface Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  verbose?: boolean;
  allowDelegation?: boolean;
}

/**
 * Interface for agent context data
 */
export interface AgentContext {
  campaign: Campaign;
  memories: MemoryContext;
  currentScene?: {
    location: string;
    characters: string[];
    mood: string;
  };
}
