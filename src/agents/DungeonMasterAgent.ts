import { Agent, AgentResult, AgentTask } from './types';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/utils/edgeFunctionHandler';

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
   * Fetches campaign details from Supabase
   * @param campaignId - The ID of the campaign
   * @returns Campaign details or null if not found
   */
  private async fetchCampaignDetails(campaignId: string) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      return null;
    }
  }

  /**
   * Executes a given task using the agent's capabilities
   * @param task - The task to be executed
   * @returns Promise<AgentResult>
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    try {
      console.log(`DM Agent executing task: ${task.description}`);

      // Fetch campaign details if campaignId is provided in context
      const campaignDetails = task.context?.campaignId ? 
        await this.fetchCampaignDetails(task.context.campaignId) : null;

      const data = await callEdgeFunction('dm-agent-execute', {
        task,
        agentContext: {
          role: this.role,
          goal: this.goal,
          backstory: this.backstory,
          campaignDetails
        }
      });

      if (!data) throw new Error('Failed to execute task');

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