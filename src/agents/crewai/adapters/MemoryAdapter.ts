import { AgentMemory } from '../types/memory';
import { Memory } from '@/components/game/memory/types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Adapter class that bridges our existing memory system with CrewAI
 */
export class MemoryAdapter implements AgentMemory {
  private sessionId: string;
  shortTerm: Memory[] = [];
  longTerm: Memory[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Retrieves memories based on context
   */
  async retrieve(context: any): Promise<Memory[]> {
    try {
      console.log('[MemoryAdapter] Retrieving memories with context:', context);
      
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update short-term memory cache
      this.shortTerm = data.slice(0, 10); // Keep last 10 memories in short-term
      this.longTerm = data;

      return data;
    } catch (error) {
      console.error('[MemoryAdapter] Error retrieving memories:', error);
      return [];
    }
  }

  /**
   * Stores a new memory
   */
  async store(memory: Partial<Memory>): Promise<void> {
    try {
      console.log('[MemoryAdapter] Storing new memory:', memory);

      const { error } = await supabase
        .from('memories')
        .insert([{
          ...memory,
          session_id: this.sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Update local cache
      if (this.shortTerm.length >= 10) {
        this.shortTerm.pop();
      }
      this.shortTerm.unshift(memory as Memory);
      this.longTerm.unshift(memory as Memory);

    } catch (error) {
      console.error('[MemoryAdapter] Error storing memory:', error);
      throw error;
    }
  }

  /**
   * Removes a memory by ID
   */
  async forget(memoryId: string): Promise<void> {
    try {
      console.log('[MemoryAdapter] Forgetting memory:', memoryId);

      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;

      // Update local cache
      this.shortTerm = this.shortTerm.filter(m => m.id !== memoryId);
      this.longTerm = this.longTerm.filter(m => m.id !== memoryId);

    } catch (error) {
      console.error('[MemoryAdapter] Error forgetting memory:', error);
      throw error;
    }
  }
}