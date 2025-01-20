import { Agent, AgentResult, AgentTask } from './types';
import { AgentMessagingService } from './messaging/AgentMessagingService';
import { MessageType, MessagePriority } from './crewai/types/communication';
import { ErrorHandlingService } from './error/services/ErrorHandlingService';
import { ErrorCategory, ErrorSeverity } from './error/types';
import { ResponseCoordinator } from './services/response/ResponseCoordinator';
import { GameState } from '../types/gameState';

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
  private gameState: Partial<GameState>;

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
    this.gameState = this.initializeGameState();
  }

  private initializeGameState(): Partial<GameState> {
    return {
      location: {
        name: 'Starting Location',
        description: 'The beginning of your adventure',
        atmosphere: 'neutral',
        timeOfDay: 'dawn'
      },
      activeNPCs: [],
      sceneStatus: {
        currentAction: 'beginning',
        availableActions: [],
        environmentalEffects: [],
        threatLevel: 'none'
      }
    };
  }

  private updateGameState(newState: Partial<GameState>) {
    this.gameState = {
      ...this.gameState,
      ...newState
    };
    console.log('Updated game state:', this.gameState);
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

      // Add game state to task context
      const enhancedTask = {
        ...task,
        context: {
          ...task.context,
          gameState: this.gameState
        }
      };

      // Generate response
      const response = await this.responseCoordinator.generateResponse(enhancedTask);

      // Update game state based on response
      if (response.data?.narrativeResponse) {
        const { environment, characters } = response.data.narrativeResponse;
        this.updateGameState({
          location: {
            ...this.gameState.location,
            description: environment.description,
            atmosphere: environment.atmosphere
          },
          activeNPCs: characters.activeNPCs.map(name => ({
            id: name.toLowerCase().replace(/\s/g, '_'),
            name,
            description: '',
            personality: '',
            currentStatus: 'active'
          })),
          sceneStatus: {
            ...this.gameState.sceneStatus,
            availableActions: response.data.narrativeResponse.opportunities.immediate
          }
        });
      }

      // Notify other agents
      await this.notifyAgents(enhancedTask, response);

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