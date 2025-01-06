import { AgentState, StateChange } from './state';
import { MessageType } from './communication';

export interface BaseMessagePayload {
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface StateUpdateMessagePayload extends BaseMessagePayload {
  agentId: string;
  stateChanges: StateChange;
  previousState?: AgentState;
}

export interface MessagePayload extends BaseMessagePayload {
  type: MessageType;
  content: any;
}