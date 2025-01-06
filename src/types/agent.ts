import { Campaign } from './campaign';
import { MemoryContext } from './memory';

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