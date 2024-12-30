import { Agent, AgentResult, AgentTask } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * DungeonMasterAgent class handles the main game orchestration
 * and decision-making processes
 */
export class DungeonMasterAgent implements Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  verbose: boolean;
  allowDelegation: boolean;

  constructor() {
    this.id = 'dm_agent_1';
    this.role = 'Dungeon Master';
    this.goal = 'Guide players through an engaging D&D campaign';
    this.backstory = 'An experienced DM with vast knowledge of D&D rules and creative storytelling abilities';
    this.verbose = true;
    this.allowDelegation = true;
  }

  /**
   * Executes a given task using the agent's capabilities
   * @param task - The task to be executed
   * @returns Promise<AgentResult>
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    try {
      console.log(`DM Agent executing task: ${task.description}`);

      // Call the AI function through our Edge Function
      const { data, error } = await supabase.functions.invoke('dm-agent-execute', {
        body: {
          task,
          agentContext: {
            role: this.role,
            goal: this.goal,
            backstory: this.backstory
          }
        }
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Task executed successfully',
        data
      };
    } catch (error) {
      console.error('Error executing DM agent task:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute task'
      };
    }
  }
}