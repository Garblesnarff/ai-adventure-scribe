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
   * Fetches campaign details from Supabase
   * @param campaignId - The ID of the campaign
   * @returns Campaign details or null if not found
   */
  private async fetchCampaignDetails(campaignId: string) {
    try {
      console.log('Fetching campaign details for ID:', campaignId);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Error fetching campaign details:', error);
        throw error;
      }
      console.log('Retrieved campaign details:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchCampaignDetails:', error);
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
      console.log(`DM Agent executing task:`, task);

      if (!task.context?.campaignId) {
        throw new Error('Campaign ID is required for DM agent execution');
      }

      // Fetch campaign details
      const campaignDetails = await this.fetchCampaignDetails(task.context.campaignId);
      
      if (!campaignDetails) {
        throw new Error('Failed to fetch campaign details');
      }

      console.log('Calling edge function with context:', {
        task,
        agentContext: {
          role: this.role,
          goal: this.goal,
          backstory: this.backstory,
          campaignDetails,
          currentState: task.context?.currentState || 'initial'
        }
      });

      // Call the AI function through our Edge Function
      const { data, error } = await supabase.functions.invoke('dm-agent-execute', {
        body: {
          task,
          agentContext: {
            role: this.role,
            goal: this.goal,
            backstory: this.backstory,
            campaignDetails,
            currentState: task.context?.currentState || 'initial'
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('DM Agent response:', data);

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