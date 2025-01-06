import { Memory } from '@/components/game/memory/types';

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