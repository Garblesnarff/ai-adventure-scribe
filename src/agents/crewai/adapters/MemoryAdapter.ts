import { supabase } from '@/integrations/supabase/client';
import { Memory, MemoryType } from '../types/memory';
import { Json } from '@/integrations/supabase/types';

/**
 * Adapter class to bridge between CrewAI memory system and application memory storage
 */
export class MemoryAdapter {
  private shortTerm: Memory[] = [];
  private longTerm: Memory[] = [];
  private readonly sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Retrieves all memories for the current session
   */
  async getAllMemories(): Promise<Memory[]> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(this.validateAndConvertMemory) || [];
  }

  /**
   * Retrieves recent memories
   */
  async getRecentMemories(limit: number = 5): Promise<Memory[]> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.map(this.validateAndConvertMemory) || [];
  }

  /**
   * Stores a new memory
   */
  async storeMemory(memory: Partial<Memory>): Promise<void> {
    const memoryData = this.prepareMemoryForStorage(memory);
    
    const { error } = await supabase
      .from('memories')
      .insert([memoryData]);

    if (error) throw error;

    const newMemory = this.validateAndConvertMemory({
      ...memoryData,
      id: '', // Will be replaced by actual ID from database
    });

    this.updateMemoryCache(newMemory);
  }

  /**
   * Prepares memory data for storage in Supabase
   */
  private prepareMemoryForStorage(memory: Partial<Memory>): Record<string, any> {
    const type = this.validateMemoryType(memory.type);

    return {
      content: memory.content,
      type,
      session_id: this.sessionId,
      importance: memory.importance || 0,
      embedding: this.formatEmbedding(memory.embedding),
      metadata: memory.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Validates and formats the embedding data
   */
  private formatEmbedding(embedding: string | number[] | undefined): string {
    if (!embedding) return '';
    return Array.isArray(embedding) ? JSON.stringify(embedding) : embedding;
  }

  /**
   * Validates memory type
   */
  private validateMemoryType(type: MemoryType | undefined): MemoryType {
    return type && isValidMemoryType(type) ? type : 'general';
  }

  /**
   * Updates the memory cache
   */
  private updateMemoryCache(newMemory: Memory): void {
    if (this.shortTerm.length >= 10) {
      const oldestMemory = this.shortTerm.pop();
      if (oldestMemory) {
        this.longTerm.push(oldestMemory);
      }
    }
    this.shortTerm.unshift(newMemory);
  }

  /**
   * Validates and converts a database record to a Memory object
   */
  private validateAndConvertMemory(record: any): Memory {
    return {
      id: record.id || '',
      content: record.content || '',
      type: this.validateMemoryType(record.type as MemoryType),
      session_id: record.session_id || this.sessionId,
      importance: record.importance || 0,
      embedding: record.embedding || '',
      metadata: record.metadata || {},
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || new Date().toISOString(),
    };
  }
}

/**
 * Type guard for memory types
 */
function isValidMemoryType(type: string): type is MemoryType {
  return ['general', 'location', 'character', 'plot', 'item'].includes(type);
}