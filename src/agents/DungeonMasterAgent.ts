import { Agent, AgentResult, AgentTask } from './types';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/utils/edgeFunctionHandler';
import { AgentMessagingService } from './messaging/AgentMessagingService';
import { MessageType, MessagePriority } from './crewai/types/communication';
import { ErrorHandlingService } from './error/services/ErrorHandlingService';
import { ErrorCategory, ErrorSeverity } from './error/types';
import { DMResponseGenerator } from './services/DMResponseGenerator';

export class DungeonMasterAgent implements Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  verbose: boolean;
  allowDelegation: boolean;
  private messagingService: AgentMessagingService;
  private responseGenerator: DMResponseGenerator | null = null;
  private conversationState: {
    currentNPC: string | null;
    dialogueHistory: Array<{ speaker: string; text: string }>;
    playerChoices: string[];
    lastResponse: string | null;
  };

  constructor() {
    this.id = 'dm_agent_1';
    this.role = 'Dungeon Master';
    this.goal = 'Guide players through an engaging D&D campaign';
    this.backstory = 'An experienced DM with vast knowledge of D&D rules and creative storytelling abilities';
    this.verbose = true;
    this.allowDelegation = true;
    this.messagingService = AgentMessagingService.getInstance();
    this.conversationState = {
      currentNPC: null,
      dialogueHistory: [],
      playerChoices: [],
      lastResponse: null
    };
  }

  private async fetchCampaignDetails(campaignId: string) {
    try {
      const { data, error } = await ErrorHandlingService.getInstance().handleDatabaseOperation(
        async () => supabase.from('campaigns').select('*').eq('id', campaignId).single(),
        {
          category: ErrorCategory.DATABASE,
          context: 'DungeonMasterAgent.fetchCampaignDetails',
          severity: ErrorSeverity.HIGH
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      return null;
    }
  }

  private detectPlayerIntent(message: string): 'dialogue' | 'exploration' | 'other' {
    const dialogueKeywords = ['talk', 'speak', 'chat', 'ask', 'tell', 'say', 'greet'];
    const explorationKeywords = ['explore', 'look', 'search', 'investigate', 'examine'];
    
    message = message.toLowerCase();
    
    if (dialogueKeywords.some(keyword => message.includes(keyword))) {
      return 'dialogue';
    }
    if (explorationKeywords.some(keyword => message.includes(keyword))) {
      return 'exploration';
    }
    return 'other';
  }

  private updateConversationState(playerMessage: string, response: any) {
    // Update dialogue history
    this.conversationState.dialogueHistory.push({ 
      speaker: 'player', 
      text: playerMessage 
    });

    if (response.characters?.dialogue) {
      this.conversationState.dialogueHistory.push({
        speaker: response.characters.activeNPCs[0] || 'NPC',
        text: response.characters.dialogue
      });
    }

    // Update current NPC if in dialogue
    if (response.characters?.activeNPCs?.length > 0) {
      this.conversationState.currentNPC = response.characters.activeNPCs[0];
    }

    // Store available choices for the player
    this.conversationState.playerChoices = response.opportunities?.immediate || [];
    this.conversationState.lastResponse = response;
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    const errorHandler = ErrorHandlingService.getInstance();

    try {
      console.log(`DM Agent executing task: ${task.description}`);

      // Initialize response generator if needed
      if (!this.responseGenerator && task.context?.campaignId && task.context?.sessionId) {
        this.responseGenerator = new DMResponseGenerator(
          task.context.campaignId,
          task.context.sessionId
        );
        await this.responseGenerator.initialize();
      }

      const campaignDetails = task.context?.campaignId ? 
        await this.fetchCampaignDetails(task.context.campaignId) : null;

      // Detect player intent
      const playerIntent = this.detectPlayerIntent(task.description);
      console.log('Detected player intent:', playerIntent);

      // Generate narrative response with conversation context
      let narrativeResponse = null;
      if (this.responseGenerator) {
        narrativeResponse = await this.responseGenerator.generateResponse(
          task.description,
          {
            playerIntent,
            conversationState: this.conversationState,
            campaignContext: campaignDetails
          }
        );
      }

      // Update conversation state with new response
      if (narrativeResponse) {
        this.updateConversationState(task.description, narrativeResponse);
      }

      // Notify other agents about task execution with error handling
      await errorHandler.handleOperation(
        async () => this.messagingService.sendMessage(
          this.id,
          'rules_interpreter_1',
          MessageType.TASK,
          {
            taskDescription: task.description,
            campaignContext: campaignDetails,
            conversationState: this.conversationState
          },
          MessagePriority.HIGH
        ),
        {
          category: ErrorCategory.AGENT,
          context: 'DungeonMasterAgent.executeTask.sendMessage',
          severity: ErrorSeverity.MEDIUM
        }
      );

      // Call edge function with proper error handling
      const data = await errorHandler.handleOperation(
        async () => {
          console.log('Calling dm-agent-execute with payload:', {
            task,
            agentContext: {
              role: this.role,
              goal: this.goal,
              backstory: this.backstory,
              campaignDetails,
              narrativeResponse,
              conversationState: this.conversationState
            }
          });
          
          return await callEdgeFunction('dm-agent-execute', {
            task,
            agentContext: {
              role: this.role,
              goal: this.goal,
              backstory: this.backstory,
              campaignDetails,
              narrativeResponse,
              conversationState: this.conversationState
            }
          });
        },
        {
          category: ErrorCategory.NETWORK,
          context: 'DungeonMasterAgent.executeTask.edgeFunction',
          severity: ErrorSeverity.HIGH,
          retryConfig: {
            maxRetries: 3,
            initialDelay: 1000
          }
        }
      );

      if (!data) throw new Error('Failed to execute task');

      // Notify about task completion with error handling
      await errorHandler.handleOperation(
        async () => this.messagingService.sendMessage(
          this.id,
          'narrator_1',
          MessageType.RESULT,
          {
            taskId: task.id,
            result: data,
            conversationState: this.conversationState
          },
          MessagePriority.MEDIUM
        ),
        {
          category: ErrorCategory.AGENT,
          context: 'DungeonMasterAgent.executeTask.notifyCompletion',
          severity: ErrorSeverity.MEDIUM
        }
      );

      return {
        success: true,
        message: 'Task executed successfully',
        data: {
          ...data,
          narrativeResponse
        }
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