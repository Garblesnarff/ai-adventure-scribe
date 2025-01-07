import { MessageType, MessagePriority } from '../crewai/types/communication';

export interface MessageDeliveryStatus {
  delivered: boolean;
  timestamp: Date;
  attempts: number;
  error?: string;
}

export interface MessageAcknowledgment {
  messageId: string;
  receiverId: string;
  timestamp: Date;
  status: 'received' | 'processed' | 'failed';
}

export interface QueuedMessage {
  id: string;
  type: MessageType;
  content: any;
  priority: MessagePriority;
  sender: string;
  receiver: string;
  timestamp: Date;
  deliveryStatus: MessageDeliveryStatus;
  acknowledgment?: MessageAcknowledgment;
  retryCount: number;
  maxRetries: number;
}

export interface MessageQueueConfig {
  maxRetries: number;
  retryDelay: number;
  timeoutDuration: number;
  maxQueueSize: number;
}