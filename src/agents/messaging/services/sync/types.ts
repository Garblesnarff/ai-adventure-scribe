import { MessageType, MessagePriority } from '../../types';
import { QueuedMessage } from '../MessageQueueService';

export interface VectorClock {
  [agentId: string]: number;
}

export interface SyncState {
  lastSequenceNumber: number;
  vectorClock: VectorClock;
  pendingMessages: string[];
  conflicts: string[];
}

export interface MessageSequence {
  id: string;
  messageId: string;
  sequenceNumber: number;
  vectorClock: VectorClock;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatus {
  id: string;
  agentId: string;
  lastSyncTimestamp: string;
  syncState: SyncState;
  vectorClock: VectorClock;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictResolutionStrategy {
  type: 'timestamp' | 'priority' | 'custom';
  resolve: (messages: QueuedMessage[]) => QueuedMessage;
}

export interface MessageSyncOptions {
  maxRetries?: number;
  retryDelay?: number;
  conflictStrategy?: ConflictResolutionStrategy;
  consistencyCheckInterval?: number;
}