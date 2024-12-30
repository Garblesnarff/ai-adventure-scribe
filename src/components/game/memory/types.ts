/**
 * Interface for memory data structure
 */
export interface Memory {
  id: string;
  type: string; // Changed from union type to string to match database
  content: string;
  importance: number;
  embedding?: number[] | string | null; // Added string type to match database
  metadata: Record<string, any>;
  created_at: string;
  session_id?: string | null;
  updated_at: string;
}

/**
 * Interface for memory category configuration
 */
export interface MemoryCategory {
  type: string;
  label: string;
  icon: React.ReactNode;
}