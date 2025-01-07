import { supabase } from '@/integrations/supabase/client';
import { QueuedMessage, MessageType, MessagePriority } from './types';
import { MessageQueueService } from './services/MessageQueueService';
import { MessageDeliveryService } from './services/MessageDeliveryService';
import { MessageAcknowledgmentService } from './services/MessageAcknowledgmentService';

export class AgentMessagingService {
  private static instance: AgentMessagingService;
  private queueService: MessageQueueService;
  private deliveryService: MessageDeliveryService;
  private acknowledgmentService: MessageAcknowledgmentService;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.queueService = MessageQueueService.getInstance();
    this.deliveryService = MessageDeliveryService.getInstance();
    this.acknowledgmentService = MessageAcknowledgmentService.getInstance();
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
      await this.loadPersistedMessages();
      this.startQueueProcessor();
    } catch (error) {
      console.error('[AgentMessagingService] Initialization error:', error);
    }
  }

  private async loadPersistedMessages(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('agent_communications')
        .select('*')
        .is('read_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      data.forEach(msg => {
        const queuedMessage: QueuedMessage = {
          id: msg.id,
          type: msg.message_type as MessageType,
          content: msg.content,
          priority: MessagePriority.MEDIUM,
          sender: msg.sender_id,
          receiver: msg.receiver_id,
          timestamp: new Date(msg.created_at),
          deliveryStatus: {
            delivered: false,
            timestamp: new Date(),
            attempts: 0
          },
          retryCount: 0,
          maxRetries: this.queueService.getConfig().maxRetries
        };
        this.queueService.enqueue(queuedMessage);
      });
    } catch (error) {
      console.error('[AgentMessagingService] Error loading persisted messages:', error);
    }
  }

  private startQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      await this.processMessageQueue();
    }, 1000);
  }

  private async processMessageQueue(): Promise<void> {
    const message = this.queueService.peek();
    if (!message) return;

    const delivered = await this.deliveryService.deliverMessage(message);
    
    if (delivered) {
      this.queueService.dequeue();
      await this.deliveryService.confirmDelivery(message.id);
    } else if (message.retryCount >= message.maxRetries) {
      await this.deliveryService.handleFailedDelivery(message);
      this.queueService.dequeue();
    } else {
      message.retryCount++;
      // Move to end of queue for retry
      this.queueService.dequeue();
      this.queueService.enqueue(message);
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

      return this.queueService.enqueue(message);
    } catch (error) {
      console.error('[AgentMessagingService] Send message error:', error);
      return false;
    }
  }

  public getQueueStatus(): {
    queueLength: number;
    processingMessage?: QueuedMessage;
  } {
    return {
      queueLength: this.queueService.getQueueLength(),
      processingMessage: this.queueService.peek()
    };
  }
}