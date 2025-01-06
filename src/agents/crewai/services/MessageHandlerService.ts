import { supabase } from '@/integrations/supabase/client';
import { MessageType, MessagePriority } from '../types/communication';
import {
  TaskMessagePayload,
  ResultMessagePayload,
  QueryMessagePayload,
  ResponseMessagePayload,
  StateUpdateMessagePayload
} from '../types/messages';

export class MessageHandlerService {
  private static instance: MessageHandlerService;
  private messageQueue: Map<string, any>;
  private processingQueue: boolean;
  private retryDelays: number[];
  private maxRetries: number;

  private constructor() {
    this.messageQueue = new Map();
    this.processingQueue = false;
    this.retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
    this.maxRetries = 5;
  }

  public static getInstance(): MessageHandlerService {
    if (!MessageHandlerService.instance) {
      MessageHandlerService.instance = new MessageHandlerService();
    }
    return MessageHandlerService.instance;
  }

  /**
   * Handle task messages
   */
  public async handleTaskMessage(payload: TaskMessagePayload): Promise<void> {
    try {
      console.log('[MessageHandler] Processing task message:', payload);

      const taskData = {
        task_type: 'agent_task',
        priority: payload.priority,
        data: {
          task: payload.task,
          delegatedBy: payload.delegatedBy,
          requiredCapabilities: payload.requiredCapabilities
        },
        assigned_agent_id: payload.receiver,
        status: 'pending'
      };

      const { error } = await supabase
        .from('task_queue')
        .insert(taskData);

      if (error) throw error;

      // Notify receiver
      await this.notifyAgent(payload.receiver!, {
        type: MessageType.TASK,
        content: payload
      });

    } catch (error) {
      console.error('[MessageHandler] Error handling task message:', error);
      await this.handleMessageError('task', payload, error);
    }
  }

  /**
   * Handle result messages
   */
  public async handleResultMessage(payload: ResultMessagePayload): Promise<void> {
    try {
      console.log('[MessageHandler] Processing result message:', payload);

      // Update task status
      const { error } = await supabase
        .from('task_queue')
        .update({
          status: payload.success ? 'completed' : 'failed',
          result: payload.data,
          error: payload.error,
          completed_at: new Date().toISOString()
        })
        .eq('id', payload.taskId);

      if (error) throw error;

      // Store result in memory system if successful
      if (payload.success && payload.data) {
        await this.storeResultInMemory(payload);
      }

    } catch (error) {
      console.error('[MessageHandler] Error handling result message:', error);
      await this.handleMessageError('result', payload, error);
    }
  }

  /**
   * Handle query messages
   */
  public async handleQueryMessage(payload: QueryMessagePayload): Promise<void> {
    try {
      console.log('[MessageHandler] Processing query message:', payload);

      const communicationData = {
        sender_id: payload.sender,
        receiver_id: payload.receiver,
        message_type: MessageType.QUERY,
        content: JSON.stringify(payload)
      };

      const { error } = await supabase
        .from('agent_communications')
        .insert(communicationData);

      if (error) throw error;

      // Route query to appropriate handler
      const response = await this.routeQuery(payload);

      // Send response back
      await this.sendResponse(payload.sender, response);

    } catch (error) {
      console.error('[MessageHandler] Error handling query message:', error);
      await this.handleMessageError('query', payload, error);
    }
  }

  /**
   * Handle state update messages
   */
  public async handleStateUpdate(payload: StateUpdateMessagePayload): Promise<void> {
    try {
      console.log('[MessageHandler] Processing state update:', payload);

      // Update agent state
      const { error } = await supabase
        .from('agent_states')
        .update({
          status: payload.stateChanges.status,
          configuration: payload.stateChanges,
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.agentId);

      if (error) throw error;

      // Broadcast state change to interested agents
      await this.broadcastStateChange(payload);

    } catch (error) {
      console.error('[MessageHandler] Error handling state update:', error);
      await this.handleMessageError('state_update', payload, error);
    }
  }

  /**
   * Handle message errors with retry mechanism
   */
  private async handleMessageError(
    type: string,
    payload: any,
    error: any,
    retryCount: number = 0
  ): Promise<void> {
    if (retryCount < this.maxRetries) {
      const delay = this.retryDelays[retryCount];
      console.log(`[MessageHandler] Retrying ${type} message in ${delay}ms (attempt ${retryCount + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      switch (type) {
        case 'task':
          return this.handleTaskMessage(payload);
        case 'result':
          return this.handleResultMessage(payload);
        case 'query':
          return this.handleQueryMessage(payload);
        case 'state_update':
          return this.handleStateUpdate(payload);
      }
    } else {
      console.error(`[MessageHandler] Max retries reached for ${type} message:`, payload);
      // Store failed message for recovery
      await this.storeFailedMessage(type, payload, error);
    }
  }

  /**
   * Store failed messages for recovery
   */
  private async storeFailedMessage(type: string, payload: any, error: any): Promise<void> {
    try {
      await supabase
        .from('agent_communications')
        .insert({
          message_type: `failed_${type}`,
          content: {
            payload,
            error: error.message || error,
            timestamp: new Date().toISOString()
          }
        });
    } catch (storeError) {
      console.error('[MessageHandler] Error storing failed message:', storeError);
    }
  }

  /**
   * Store result in memory system
   */
  private async storeResultInMemory(payload: ResultMessagePayload): Promise<void> {
    try {
      await supabase
        .from('memories')
        .insert({
          type: 'task_result',
          content: JSON.stringify(payload.data),
          importance: 5,
          metadata: {
            taskId: payload.taskId,
            executionTime: payload.executionTime
          }
        });
    } catch (error) {
      console.error('[MessageHandler] Error storing result in memory:', error);
    }
  }

  /**
   * Route query to appropriate handler
   */
  private async routeQuery(payload: QueryMessagePayload): Promise<any> {
    // Implement query routing logic based on queryType
    // This is a placeholder implementation
    return {
      queryId: payload.queryId,
      status: 'success',
      data: { message: 'Query processed' }
    };
  }

  /**
   * Send response to agent
   */
  private async sendResponse(agentId: string, response: any): Promise<void> {
    await this.notifyAgent(agentId, {
      type: MessageType.RESPONSE,
      content: response
    });
  }

  /**
   * Broadcast state change to interested agents
   */
  private async broadcastStateChange(payload: StateUpdateMessagePayload): Promise<void> {
    // Get list of agents interested in this state change
    const { data: interestedAgents } = await supabase
      .from('agent_states')
      .select('id')
      .neq('id', payload.agentId);

    if (interestedAgents) {
      for (const agent of interestedAgents) {
        await this.notifyAgent(agent.id, {
          type: MessageType.STATE_UPDATE,
          content: payload
        });
      }
    }
  }

  /**
   * Notify an agent
   */
  private async notifyAgent(agentId: string, message: any): Promise<void> {
    try {
      const notificationData = {
        receiver_id: agentId,
        message_type: message.type,
        content: JSON.stringify(message.content)
      };

      await supabase
        .from('agent_communications')
        .insert(notificationData);
    } catch (error) {
      console.error('[MessageHandler] Error notifying agent:', error);
      throw error;
    }
  }
}