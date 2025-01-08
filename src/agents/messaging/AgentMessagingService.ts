import { supabase } from '@/integrations/supabase/client';
import { QueuedMessage, MessageType, MessagePriority } from './types';
import { MessageQueueService } from './services/MessageQueueService';
import { MessageDeliveryService } from './services/MessageDeliveryService';
import { MessageAcknowledgmentService } from './services/MessageAcknowledgmentService';
import { MessagePersistenceService } from './services/storage/MessagePersistenceService';
import { MessageRecoveryService } from './services/recovery/MessageRecoveryService';
import { OfflineStateService } from './services/offline/OfflineStateService';

export class AgentMessagingService {
  private static instance: AgentMessagingService;
  private queueService: MessageQueueService;
  private deliveryService: MessageDeliveryService;
  private acknowledgmentService: MessageAcknowledgmentService;
  private persistenceService: MessagePersistenceService;
  private recoveryService: MessageRecoveryService;
  private offlineService: OfflineStateService;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.queueService = MessageQueueService.getInstance();
    this.deliveryService = MessageDeliveryService.getInstance();
    this.acknowledgmentService = MessageAcknowledgmentService.getInstance();
    this.persistenceService = MessagePersistenceService.getInstance();
    this.recoveryService = MessageRecoveryService.getInstance();
    this.offlineService = OfflineStateService.getInstance();
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
      await this.recoveryService.recoverMessages();
      
      if (this.offlineService.isOnline()) {
        this.startQueueProcessor();
      }
    } catch (error) {
      console.error('[AgentMessagingService] Initialization error:', error);
    }
  }

  private startQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      if (this.offlineService.isOnline()) {
        await this.processMessageQueue();
      }
    }, 1000);
  }

  private async processMessageQueue(): Promise<void> {
    const isValid = await this.queueService.validateQueue();
    if (!isValid) {
      console.warn('[AgentMessagingService] Queue validation failed, initiating recovery...');
      await this.recoveryService.recoverMessages();
      return;
    }

    const message = this.queueService.peek();
    if (!message) return;

    try {
      const delivered = await this.deliveryService.deliverMessage(message);
      
      if (delivered) {
        this.queueService.dequeue();
        await this.persistenceService.updateMessageStatus(message.id, 'sent');
        await this.deliveryService.confirmDelivery(message.id);
        await this.queueService.completeProcessing(true);
      } else if (message.retryCount >= message.maxRetries) {
        await this.deliveryService.handleFailedDelivery(message);
        this.queueService.dequeue();
        await this.persistenceService.updateMessageStatus(message.id, 'failed');
        await this.queueService.completeProcessing(false);
      } else {
        message.retryCount++;
        this.queueService.dequeue();
        this.queueService.enqueue(message);
        await this.persistenceService.updateMessageStatus(message.id, 'pending');
        await this.queueService.completeProcessing(false);
      }
    } catch (error) {
      console.error('[AgentMessagingService] Error processing message:', error);
      await this.queueService.completeProcessing(false);
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
    metrics: any;
    offlineState?: OfflineState;
  } {
    return {
      queueLength: this.queueService.getQueueLength(),
      processingMessage: this.queueService.peek(),
      isOnline: this.offlineService.isOnline(),
      metrics: this.queueService.getMetrics(),
      offlineState: this.offlineService.getState()
    };
  }
}
