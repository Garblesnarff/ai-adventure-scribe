/**
 * Interface for memory data structure
 */
export interface Memory {
  id: string;
  type: 'location' | 'character' | 'event' | 'item' | 'general';
  content: string;
  importance: number;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Interface for memory category configuration
 */
export interface MemoryCategory {
  type: string;
  label: string;
  icon: React.ReactNode;
}