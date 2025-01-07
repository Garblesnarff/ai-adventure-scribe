export interface StoredMessage {
  id: string;
  content: any;
  type: string;
  priority: number;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed' | 'acknowledged';
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface QueueState {
  lastSyncTimestamp: string;
  pendingMessages: string[];
  processingMessage?: string;
  isOnline: boolean;
}

export interface StorageConfig {
  dbName: string;
  messageStoreName: string;
  queueStoreName: string;
  version: number;
}