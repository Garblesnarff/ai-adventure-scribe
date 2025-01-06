import { Agent, AgentTask } from '../types';
import { Memory } from '@/components/game/memory/types';

/**
 * Enum for CrewAI agent roles
 */
export enum CrewAIRole {
  DungeonMaster = 'dungeon_master',
  MemoryKeeper = 'memory_keeper',
  RulesInterpreter = 'rules_interpreter',
  Narrator = 'narrator'
}

/**
 * Interface for CrewAI agent tools
 */
export interface AgentTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
  permissions?: string[];
}

/**
 * Interface for CrewAI agent memory operations
 */
export interface AgentMemory {
  shortTerm: Memory[];
  longTerm: Memory[];
  retrieve: (context: any) => Promise<Memory[]>;
  store: (memory: Partial<Memory>) => Promise<void>;
  forget: (memoryId: string) => Promise<void>;
}

/**
 * Enum for CrewAI message types
 */
export enum MessageType {
  TASK = 'TASK',
  RESULT = 'RESULT',
  QUERY = 'QUERY',
  RESPONSE = 'RESPONSE',
  STATE_UPDATE = 'STATE_UPDATE'
}

/**
 * Enum for message priorities
 */
export enum MessagePriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Interface for CrewAI agent messages
 */
export interface AgentMessage {
  type: MessageType;
  content: any;
  metadata?: {
    priority?: MessagePriority;
    timestamp: Date;
    sender?: string;
    receiver?: string;
  }
}

/**
 * Interface that bridges existing Agent with CrewAI capabilities
 */
export interface CrewAIAgentBridge extends Agent {
  // Keep all existing Agent properties from base interface
  id: string;
  role: string;
  goal: string;
  backstory: string;
  
  // Add optional CrewAI properties
  crewAIConfig?: {
    tools: AgentTool[];
    memory: AgentMemory;
    communicate: (message: AgentMessage) => Promise<void>;
  }
}

/**
 * Enhanced task interface that works with both systems
 */
export interface CrewAITask extends AgentTask {
  crewAIContext?: {
    assignedAgent?: string;
    priority?: MessagePriority;
    dependencies?: string[];
    status?: TaskStatus;
  }
}

/**
 * Enum for task status
 */
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * Interface for task execution results
 */
export interface TaskResult {
  success: boolean;
  data?: any;
  error?: Error;
  metadata?: {
    executionTime: number;
    resourcesUsed?: string[];
    agentId: string;
  }
}
