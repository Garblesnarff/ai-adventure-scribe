import { Json } from '@/integrations/supabase/types';

/**
 * Available memory types
 */
export type MemoryType = 'location' | 'character' | 'event' | 'item' | 'general';

/**
 * Interface for memory data structure
 */
export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  embedding?: number[] | string | null;
  metadata: Json | null;
  created_at: string;
  session_id?: string | null;
  updated_at: string;
}

/**
 * Interface for memory category configuration
 */
export interface MemoryCategory {
  type: MemoryType;
  label: string;
  icon: React.ReactNode;
}