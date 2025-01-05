import { Json } from '@/integrations/supabase/types';

/**
 * Available memory types
 */
export type MemoryType = 'location' | 'character' | 'event' | 'item' | 'general';

/**
 * Type guard to check if a string is a valid MemoryType
 */
export function isValidMemoryType(type: string): type is MemoryType {
  return ['location', 'character', 'event', 'item', 'general'].includes(type);
}

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