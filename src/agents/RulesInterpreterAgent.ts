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
  private validationCache: Map<string, any>;

  constructor() {
    this.id = 'rules_interpreter_1';
    this.role = 'Rules Interpreter';
    this.goal = 'Ensure accurate interpretation and application of D&D 5E rules';
    this.backstory = 'An expert in D&D 5E rules with comprehensive knowledge of game mechanics';
    this.verbose = true;
    this.allowDelegation = true;
    this.messagingService = AgentMessagingService.getInstance();
    this.validationCache = new Map();
  }

  private async validateRules(ruleContext: any) {
    const cacheKey = `${ruleContext.type}_${JSON.stringify(ruleContext)}`;
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      console.log('Using cached validation result');
      return this.validationCache.get(cacheKey);
    }

    try {
      const { data, error } = await supabase
        .from('rule_validations')
        .select('*')
        .eq('rule_type', ruleContext.type)
        .eq('is_active', true);

      if (error) throw error;

      // Cache the result
      this.validationCache.set(cacheKey, data);
      
      // Clear old cache entries if cache gets too large
      if (this.validationCache.size > 100) {
        const oldestKey = this.validationCache.keys().next().value;
        this.validationCache.delete(oldestKey);
      }

      return data;
    } catch (error) {
      console.error('Error validating rules:', error);
      return null;
    }
  }

  private async processValidationResults(validationResults: any) {
    if (!validationResults) return null;

    const processedResults = {
      isValid: true,
      validations: [],
      suggestions: [],
      errors: []
    };

    for (const validation of validationResults) {
      const result = await this.evaluateRule(validation);
      processedResults.validations.push(result);
      
      if (!result.isValid) {
        processedResults.isValid = false;
        processedResults.errors.push(result.error);
      }
      
      if (result.suggestions) {
        processedResults.suggestions.push(...result.suggestions);
      }
    }

    return processedResults;
  }

  private async evaluateRule(rule: any) {
    const result = {
      isValid: true,
      error: null,
      suggestions: []
    };

    try {
      // Check rule conditions
      if (rule.rule_conditions) {
        for (const condition of rule.rule_conditions) {
          const conditionMet = await this.checkCondition(condition);
          if (!conditionMet) {
            result.isValid = false;
            result.error = `Failed condition: ${condition.description}`;
            result.suggestions.push(condition.suggestion);
          }
        }
      }

      // Check rule requirements
      if (rule.rule_requirements) {
        for (const requirement of rule.rule_requirements) {
          const requirementMet = await this.checkRequirement(requirement);
          if (!requirementMet) {
            result.isValid = false;
            result.error = `Missing requirement: ${requirement.description}`;
            result.suggestions.push(requirement.suggestion);
          }
        }
      }
    } catch (error) {
      result.isValid = false;
      result.error = `Rule evaluation error: ${error.message}`;
    }

    return result;
  }

  private async checkCondition(condition: any) {
    // Implement condition checking logic
    return true; // Placeholder
  }

  private async checkRequirement(requirement: any) {
    // Implement requirement checking logic
    return true; // Placeholder
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    const errorHandler = ErrorHandlingService.getInstance();

    try {
      console.log(`Rules Interpreter executing task: ${task.description}`);

      // Validate rules based on task context
      const ruleValidations = task.context?.ruleType ? 
        await this.validateRules(task.context) : null;

      // Process validation results
      const processedResults = await this.processValidationResults(ruleValidations);

      // Notify DM agent about rule interpretation
      await errorHandler.handleOperation(
        async () => this.messagingService.sendMessage(
          this.id,
          'dm_agent_1',
          MessageType.TASK,
          {
            taskDescription: task.description,
            validationResults: processedResults
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
            validationResults: processedResults
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
        data: {
          ...data,
          validationResults: processedResults
        }
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