import { supabase } from '@/integrations/supabase/client';
import { MemoryAdapter } from '../adapters/MemoryAdapter';
import { CrewAITask, TaskStatus, TaskResult } from '../types/tasks';

export class DMTaskExecutor {
  private memoryAdapter: MemoryAdapter;

  constructor(memoryAdapter: MemoryAdapter) {
    this.memoryAdapter = memoryAdapter;
  }

  /**
   * Execute a task with memory integration and validation
   */
  async executeTask(task: CrewAITask): Promise<TaskResult> {
    console.log('CrewAI DM Agent executing task:', task);
    const startTime = Date.now();
    
    try {
      // Validate task and dependencies
      await this.validateTask(task);
      
      // Update task status
      await this.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS);
      
      // Get relevant memories for context
      const memories = await this.memoryAdapter.getRecentMemories();
      
      // Execute AI function with enhanced context
      const result = await this.executeAIFunction(task, memories);
      
      // Store task result
      await this.storeTaskResult(result);
      
      // Update final status
      await this.updateTaskStatus(task.id, TaskStatus.COMPLETED);
      
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          agentId: 'dm_agent',
          resourcesUsed: ['memory', 'ai_model']
        }
      };
    } catch (error) {
      console.error('Error executing CrewAI DM agent task:', error);
      
      // Update status to failed
      await this.updateTaskStatus(task.id, TaskStatus.FAILED);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Task execution failed'),
        metadata: {
          executionTime: Date.now() - startTime,
          agentId: 'dm_agent'
        }
      };
    }
  }

  /**
   * Validate task and its dependencies
   */
  private async validateTask(task: CrewAITask): Promise<void> {
    if (!task.id || !task.description) {
      throw new Error('Invalid task: missing required fields');
    }

    // Check dependencies if they exist
    if (task.crewAIContext?.dependencies?.length) {
      const { data: dependentTasks } = await supabase
        .from('task_queue')
        .select('id, status')
        .in('id', task.crewAIContext.dependencies);

      const incompleteTasks = dependentTasks?.filter(t => 
        t.status !== TaskStatus.COMPLETED
      );

      if (incompleteTasks?.length) {
        throw new Error('Dependencies not met: some required tasks are incomplete');
      }
    }
  }

  /**
   * Update task status in database
   */
  private async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const { error } = await supabase
      .from('task_queue')
      .update({ status })
      .eq('id', taskId);

    if (error) throw error;
  }

  /**
   * Execute AI function through Edge Function with enhanced context
   */
  private async executeAIFunction(task: CrewAITask, memories: any[]): Promise<any> {
    const { data, error } = await supabase.functions.invoke('dm-agent-execute', {
      body: {
        task,
        memories,
        agentContext: {
          role: 'Dungeon Master',
          goal: 'Guide players through an engaging D&D campaign with advanced AI capabilities',
          backstory: 'An experienced DM enhanced with CrewAI capabilities for dynamic storytelling',
          taskContext: {
            priority: task.crewAIContext?.priority || 'MEDIUM',
            dependencies: task.crewAIContext?.dependencies || []
          }
        }
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Store task result in memory with importance scoring
   */
  private async storeTaskResult(result: any): Promise<void> {
    const importance = this.calculateResultImportance(result);
    
    await this.memoryAdapter.storeMemory({
      content: JSON.stringify(result),
      type: 'general',
      importance
    });
  }

  /**
   * Calculate importance score for task result
   */
  private calculateResultImportance(result: any): number {
    let importance = 3; // Base importance

    // Increase importance for errors or high-priority tasks
    if (result.error) importance += 2;
    if (result.priority === 'HIGH') importance += 2;

    // Cap importance at 10
    return Math.min(10, importance);
  }
}