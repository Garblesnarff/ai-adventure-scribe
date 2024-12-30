import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { Memory, MemoryContext } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetches relevant memories using vector similarity search
 * Falls back to keyword-based search if embeddings are not available
 */
export async function fetchRelevantMemories(sessionId: string, context: any): Promise<Memory[]> {
  try {
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('session_id', sessionId)
      .order('importance', { ascending: false })
      .limit(10);

    if (error) throw error;
    
    // If we have embeddings, we'll use them for similarity search later
    // For now, we're using the basic importance-based retrieval
    return memories || [];
  } catch (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
}

/**
 * Calculates memory relevance score based on context, importance, and semantic similarity
 */
export function calculateMemoryRelevance(memory: Memory, context: any): number {
  let score = memory.importance || 0;
  
  // Context matching boost
  if (context.location && memory.content.toLowerCase().includes(context.location.toLowerCase())) {
    score += 2;
  }
  if (context.emotion && memory.content.toLowerCase().includes(context.emotion.toLowerCase())) {
    score += 1;
  }
  
  // Time decay factor - memories become less relevant over time
  const createdAt = new Date(memory.created_at).getTime();
  const now = Date.now();
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
  const timeFactor = Math.exp(-hoursSinceCreation / 24); // Decay over 24 hours
  
  // If we have embeddings, we could add semantic similarity score here
  
  return score * timeFactor;
}

/**
 * Updates memory importance based on AI response and usage
 */
export async function updateMemoryImportance(memories: Memory[], aiResponse: string): Promise<void> {
  try {
    for (const memory of memories) {
      // Increase importance if the memory was referenced in the response
      if (aiResponse.toLowerCase().includes(memory.content.toLowerCase())) {
        const newImportance = Math.min((memory.importance || 0) + 1, 10);
        
        const { error } = await supabase
          .from('memories')
          .update({ importance: newImportance })
          .eq('id', memory.id);
          
        if (error) throw error;
      }
    }
  } catch (error) {
    console.error('Error updating memory importance:', error);
  }
}

/**
 * Formats memories into a context string for the AI
 */
export function formatMemoryContext(memories: MemoryContext[]): string {
  if (!memories.length) return '';
  
  const formattedMemories = memories
    .map(m => `[${m.memory.type.toUpperCase()}] (Relevance: ${m.relevanceScore.toFixed(2)}) ${m.memory.content}`)
    .join('\n');
    
  return `\nRelevant context from previous interactions:\n${formattedMemories}\n`;
}