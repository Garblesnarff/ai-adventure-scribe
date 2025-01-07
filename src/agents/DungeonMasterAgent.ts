import { Agent, AgentResult, AgentTask } from './types';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/utils/edgeFunctionHandler';
import { AgentMessagingService } from './messaging/AgentMessagingService';
import { MessageType, MessagePriority } from './crewai/types/communication';

export class DungeonMasterAgent implements Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  verbose: boolean;
  allowDelegation: boolean;
  private messagingService: AgentMessagingService;

  constructor() {
    this.id = 'dm_agent_1';
    this.role = 'Dungeon Master';
    this.goal = 'Guide players through an engaging D&D campaign';
    this.backstory = 'An experienced DM with vast knowledge of D&D rules and creative storytelling abilities';
    this.verbose = true;
    this.allowDelegation = true;
    this.messagingService = AgentMessagingService.getInstance();
  }

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

  async executeTask(task: AgentTask): Promise<AgentResult> {
    try {
      console.log(`DM Agent executing task: ${task.description}`);

      const campaignDetails = task.context?.campaignId ? 
        await this.fetchCampaignDetails(task.context.campaignId) : null;

      // Notify other agents about task execution
      await this.messagingService.sendMessage(
        this.id,
        'rules_interpreter_1',
        MessageType.TASK,
        {
          taskDescription: task.description,
          campaignContext: campaignDetails
        },
        MessagePriority.HIGH
      );

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

      // Notify about task completion
      await this.messagingService.sendMessage(
        this.id,
        'narrator_1',
        MessageType.RESULT,
        {
          taskId: task.id,
          result: data
        },
        MessagePriority.MEDIUM
      );

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