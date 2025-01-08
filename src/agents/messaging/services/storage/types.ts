export interface StoredMessage {
  id: string;
  content: any;
  type: string;
  priority: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed' | 'acknowledged';
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface QueueState {
  lastSyncTimestamp: string;
  messages: QueuedMessage[];
  pendingMessages: string[];
  processingMessage?: string;
  isOnline: boolean;
  metrics: {
    totalProcessed: number;
    failedDeliveries: number;
    avgProcessingTime: number;
  };
}

export interface StorageConfig {
  dbName: string;
  messageStoreName: string;
  queueStoreName: string;
  version: number;
}