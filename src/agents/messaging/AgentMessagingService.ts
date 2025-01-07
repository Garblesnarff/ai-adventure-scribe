import { supabase } from '@/integrations/supabase/client';
import { QueuedMessage, MessageType, MessagePriority } from './types';
import { MessageQueueService } from './services/MessageQueueService';
import { MessageDeliveryService } from './services/MessageDeliveryService';
import { MessageAcknowledgmentService } from './services/MessageAcknowledgmentService';
import { MessagePersistenceService } from './services/storage/MessagePersistenceService';

export class AgentMessagingService {
  private static instance: AgentMessagingService;
  private queueService: MessageQueueService;
  private deliveryService: MessageDeliveryService;
  private acknowledgmentService: MessageAcknowledgmentService;
  private persistenceService: MessagePersistenceService;
  private processingInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.queueService = MessageQueueService.getInstance();
    this.deliveryService = MessageDeliveryService.getInstance();
    this.acknowledgmentService = MessageAcknowledgmentService.getInstance();
    this.persistenceService = MessagePersistenceService.getInstance();
    this.initializeService();
  }

  public static getInstance(): AgentMessagingService {
    if (!AgentMessagingService.instance) {
      AgentMessagingService.instance = new AgentMessagingService();
    }
    return AgentMessagingService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      await this.loadPersistedState();
      this.startQueueProcessor();
    } catch (error) {
      console.error('[AgentMessagingService] Initialization error:', error);
    }
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const queueState = await this.persistenceService.getQueueState();
      if (queueState) {
        console.log('[AgentMessagingService] Restored queue state:', queueState);
      }

      const unsentMessages = await this.persistenceService.getUnsentMessages();
      for (const message of unsentMessages) {
        const queuedMessage: QueuedMessage = {
          id: message.id,
          type: message.type as MessageType,
          content: message.content,
          priority: message.priority as MessagePriority, // Convert string back to enum
          sender: message.metadata?.sender,
          receiver: message.metadata?.receiver,
          timestamp: new Date(message.timestamp),
          deliveryStatus: {
            delivered: false,
            timestamp: new Date(),
            attempts: message.retryCount
          },
          retryCount: message.retryCount,
          maxRetries: this.queueService.getConfig().maxRetries
        };
        this.queueService.enqueue(queuedMessage);
      }

      console.log('[AgentMessagingService] Loaded persisted messages:', unsentMessages.length);
    } catch (error) {
      console.error('[AgentMessagingService] Error loading persisted state:', error);
    }
  }

  private handleOnline(): void {
    console.log('[AgentMessagingService] Connection restored');
    this.isOnline = true;
    this.startQueueProcessor();
  }

  private handleOffline(): void {
    console.log('[AgentMessagingService] Connection lost');
    this.isOnline = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private startQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      if (this.isOnline) {
        await this.processMessageQueue();
      }
    }, 1000);
  }

  private async processMessageQueue(): Promise<void> {
    const message = this.queueService.peek();
    if (!message) return;

    try {
      const delivered = await this.deliveryService.deliverMessage(message);
      
      if (delivered) {
        this.queueService.dequeue();
        await this.persistenceService.updateMessageStatus(message.id, 'sent');
        await this.deliveryService.confirmDelivery(message.id);
      } else if (message.retryCount >= message.maxRetries) {
        await this.deliveryService.handleFailedDelivery(message);
        this.queueService.dequeue();
        await this.persistenceService.updateMessageStatus(message.id, 'failed');
      } else {
        message.retryCount++;
        // Move to end of queue for retry
        this.queueService.dequeue();
        this.queueService.enqueue(message);
        await this.persistenceService.updateMessageStatus(message.id, 'pending');
      }

      // Update queue state
      await this.persistenceService.saveQueueState({
        lastSyncTimestamp: new Date().toISOString(),
        pendingMessages: this.queueService.getQueueIds(),
        processingMessage: this.queueService.peek()?.id,
        isOnline: this.isOnline
      });
    } catch (error) {
      console.error('[AgentMessagingService] Error processing message:', error);
    }
  }

  public async sendMessage(
    sender: string,
    receiver: string,
    type: MessageType,
    content: any,
    priority: MessagePriority = MessagePriority.MEDIUM
  ): Promise<boolean> {
    try {
      const message: QueuedMessage = {
        id: crypto.randomUUID(),
        type,
        content,
        priority,
        sender,
        receiver,
        timestamp: new Date(),
        deliveryStatus: {
          delivered: false,
          timestamp: new Date(),
          attempts: 0
        },
        retryCount: 0,
        maxRetries: this.queueService.getConfig().maxRetries
      };

      // Persist message before adding to queue
      await this.persistenceService.persistMessage(message);
      
      return this.queueService.enqueue(message);
    } catch (error) {
      console.error('[AgentMessagingService] Send message error:', error);
      return false;
    }
  }

  public getQueueStatus(): {
    queueLength: number;
    processingMessage?: QueuedMessage;
    isOnline: boolean;
  } {
    return {
      queueLength: this.queueService.getQueueLength(),
      processingMessage: this.queueService.peek(),
      isOnline: this.isOnline
    };
  }
}
