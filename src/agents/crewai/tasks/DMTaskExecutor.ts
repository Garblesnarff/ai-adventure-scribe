import { supabase } from '@/integrations/supabase/client';
import { MemoryAdapter } from '../adapters/MemoryAdapter';

export class DMTaskExecutor {
  private memoryAdapter: MemoryAdapter;

  constructor(memoryAdapter: MemoryAdapter) {
    this.memoryAdapter = memoryAdapter;
  }

  /**
   * Execute a task with memory integration
   */
  async executeTask(task: any): Promise<any> {
    console.log('CrewAI DM Agent executing task:', task);
    
    try {
      const memories = await this.memoryAdapter.getRecentMemories();
      const result = await this.executeAIFunction(task, memories);
      await this.storeTaskResult(result);
      
      return {
        success: true,
        message: 'Task executed successfully',
        data: result
      };
    } catch (error) {
      console.error('Error executing CrewAI DM agent task:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute task'
      };
    }
  }

  /**
   * Execute AI function through Edge Function
   */
  private async executeAIFunction(task: any, memories: any[]): Promise<any> {
    const { data, error } = await supabase.functions.invoke('dm-agent-execute', {
      body: {
        task,
        memories,
        agentContext: {
          role: 'Dungeon Master',
          goal: 'Guide players through an engaging D&D campaign with advanced AI capabilities',
          backstory: 'An experienced DM enhanced with CrewAI capabilities for dynamic storytelling'
        }
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Store task result in memory
   */
  private async storeTaskResult(result: any): Promise<void> {
    await this.memoryAdapter.storeMemory({
      content: JSON.stringify(result),
      type: 'general',
      importance: 3
    });
  }
}