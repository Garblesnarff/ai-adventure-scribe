import { AgentMemory } from '../types/memory';
import { Memory, isValidMemoryType } from '@/components/game/memory/types';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

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
   * Converts database memory to Memory type
   */
  private validateAndConvertMemory(dbMemory: any): Memory {
    const memoryType = isValidMemoryType(dbMemory.type) ? dbMemory.type : 'general';
    
    return {
      id: dbMemory.id,
      type: memoryType,
      content: dbMemory.content || '',
      importance: dbMemory.importance || 0,
      embedding: typeof dbMemory.embedding === 'string' 
        ? JSON.parse(dbMemory.embedding)
        : dbMemory.embedding,
      metadata: dbMemory.metadata || {},
      created_at: dbMemory.created_at,
      session_id: dbMemory.session_id,
      updated_at: dbMemory.updated_at
    };
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

      // Convert and validate memories
      const validatedMemories = (data || []).map(this.validateAndConvertMemory);

      // Update short-term memory cache
      this.shortTerm = validatedMemories.slice(0, 10); // Keep last 10 memories in short-term
      this.longTerm = validatedMemories;

      return validatedMemories;
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

      // Ensure required fields are present
      if (!memory.content) {
        throw new Error('Memory content is required');
      }

      // Validate memory type
      const type = memory.type && isValidMemoryType(memory.type) ? memory.type : 'general';

      const { error } = await supabase
        .from('memories')
        .insert([{
          content: memory.content,
          type,
          session_id: this.sessionId,
          importance: memory.importance || 0,
          embedding: memory.embedding,
          metadata: memory.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Update local cache
      const newMemory = this.validateAndConvertMemory({
        ...memory,
        type,
        session_id: this.sessionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (this.shortTerm.length >= 10) {
        this.shortTerm.pop();
      }
      this.shortTerm.unshift(newMemory);
      this.longTerm.unshift(newMemory);

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