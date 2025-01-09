import { Agent, AgentResult, AgentTask } from './types';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/utils/edgeFunctionHandler';
import { AgentMessagingService } from './messaging/AgentMessagingService';
import { MessageType, MessagePriority } from './crewai/types/communication';
import { ErrorHandlingService } from './error/services/ErrorHandlingService';
import { ErrorCategory, ErrorSeverity } from './error/types';

export class RulesInterpreterAgent implements Agent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  verbose: boolean;
  allowDelegation: boolean;
  private messagingService: AgentMessagingService;

  constructor() {
    this.id = 'rules_interpreter_1';
    this.role = 'Rules Interpreter';
    this.goal = 'Ensure accurate interpretation and application of D&D 5E rules';
    this.backstory = 'An expert in D&D 5E rules with comprehensive knowledge of game mechanics';
    this.verbose = true;
    this.allowDelegation = true;
    this.messagingService = AgentMessagingService.getInstance();
  }

  private async validateRules(ruleContext: any) {
    try {
      const { data, error } = await supabase
        .from('rule_validations')
        .select('*')
        .eq('rule_type', ruleContext.type)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error validating rules:', error);
      return null;
    }
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    const errorHandler = ErrorHandlingService.getInstance();

    try {
      console.log(`Rules Interpreter executing task: ${task.description}`);

      // Validate rules based on task context
      const ruleValidations = task.context?.ruleType ? 
        await this.validateRules(task.context) : null;

      // Notify DM agent about rule interpretation
      await errorHandler.handleOperation(
        async () => this.messagingService.sendMessage(
          this.id,
          'dm_agent_1',
          MessageType.TASK,
          {
            taskDescription: task.description,
            ruleValidations
          },
          MessagePriority.HIGH
        ),
        {
          category: ErrorCategory.AGENT,
          context: 'RulesInterpreterAgent.executeTask.sendMessage',
          severity: ErrorSeverity.MEDIUM
        }
      );

      const data = await errorHandler.handleOperation(
        async () => callEdgeFunction('rules-interpreter-execute', {
          task,
          agentContext: {
            role: this.role,
            goal: this.goal,
            backstory: this.backstory,
            ruleValidations
          }
        }),
        {
          category: ErrorCategory.NETWORK,
          context: 'RulesInterpreterAgent.executeTask.edgeFunction',
          severity: ErrorSeverity.HIGH,
          retryConfig: {
            maxRetries: 3,
            initialDelay: 1000
          }
        }
      );

      if (!data) throw new Error('Failed to execute task');

      return {
        success: true,
        message: 'Rules interpretation completed successfully',
        data
      };
    } catch (error) {
      console.error('Error executing Rules Interpreter task:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute task'
      };
    }
  }
}