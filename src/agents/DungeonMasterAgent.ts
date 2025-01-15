import { Agent, AgentResult, AgentTask } from './types';
import { AgentMessagingService } from './messaging/AgentMessagingService';
import { MessageType, MessagePriority } from './crewai/types/communication';
import { ErrorHandlingService } from './error/services/ErrorHandlingService';
import { ErrorCategory, ErrorSeverity } from './error/types';
import { ResponseCoordinator } from './services/response/ResponseCoordinator';

export class DungeonMasterAgent implements Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  verbose: boolean;
  allowDelegation: boolean;
  
  private messagingService: AgentMessagingService;
  private responseCoordinator: ResponseCoordinator;
  private errorHandler: ErrorHandlingService;

  constructor() {
    this.id = 'dm_agent_1';
    this.role = 'Dungeon Master';
    this.goal = 'Guide players through an engaging D&D campaign';
    this.backstory = 'An experienced DM with vast knowledge of D&D rules and creative storytelling abilities';
    this.verbose = true;
    this.allowDelegation = true;
    
    this.messagingService = AgentMessagingService.getInstance();
    this.responseCoordinator = new ResponseCoordinator();
    this.errorHandler = ErrorHandlingService.getInstance();
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    try {
      console.log(`DM Agent executing task: ${task.description}`);

      // Initialize response coordinator if needed
      if (task.context?.campaignId && task.context?.sessionId) {
        await this.responseCoordinator.initialize(
          task.context.campaignId,
          task.context.sessionId
        );
      }

      // Generate response
      const response = await this.responseCoordinator.generateResponse(task);

      // Notify other agents
      await this.notifyAgents(task, response);

      return response;
    } catch (error) {
      console.error('Error executing DM agent task:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute task'
      };
    }
  }

  private async notifyAgents(task: AgentTask, response: AgentResult): Promise<void> {
    await this.errorHandler.handleOperation(
      async () => this.messagingService.sendMessage(
        this.id,
        'rules_interpreter_1',
        MessageType.TASK,
        {
          taskDescription: task.description,
          result: response
        },
        MessagePriority.HIGH
      ),
      {
        category: ErrorCategory.AGENT,
        context: 'DungeonMasterAgent.notifyAgents',
        severity: ErrorSeverity.MEDIUM
      }
    );

    await this.errorHandler.handleOperation(
      async () => this.messagingService.sendMessage(
        this.id,
        'narrator_1',
        MessageType.RESULT,
        {
          taskId: task.id,
          result: response
        },
        MessagePriority.MEDIUM
      ),
      {
        category: ErrorCategory.AGENT,
        context: 'DungeonMasterAgent.notifyAgents',
        severity: ErrorSeverity.MEDIUM
      }
    );
  }
}