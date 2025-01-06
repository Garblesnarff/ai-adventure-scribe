import { MessageType, MessagePriority } from './communication';
import { AgentTask } from '../../types';

/**
 * Base interface for all message payloads
 */
export interface BaseMessagePayload {
  timestamp: Date;
  sender: string;
  receiver?: string;
}

/**
 * Task message payload
 */
export interface TaskMessagePayload extends BaseMessagePayload {
  task: AgentTask;
  priority: MessagePriority;
  delegatedBy?: string;
  requiredCapabilities?: string[];
}

/**
 * Result message payload
 */
export interface ResultMessagePayload extends BaseMessagePayload {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
}

/**
 * Query message payload
 */
export interface QueryMessagePayload extends BaseMessagePayload {
  queryId: string;
  queryType: string;
  parameters: Record<string, any>;
  timeout?: number;
}

/**
 * Response message payload
 */
export interface ResponseMessagePayload extends BaseMessagePayload {
  queryId: string;
  data: any;
  status: 'success' | 'error' | 'partial';
  metadata?: Record<string, any>;
}

/**
 * State update message payload
 */
export interface StateUpdateMessagePayload extends BaseMessagePayload {
  agentId: string;
  stateChanges: Record<string, any>;
  version: number;
  priority: MessagePriority;
}