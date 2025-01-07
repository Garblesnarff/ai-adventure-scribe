import { supabase } from '@/integrations/supabase/client';
import { QueuedMessage, MessageQueueConfig, MessageDeliveryStatus, MessageAcknowledgment } from './types';
import { MessageType, MessagePriority } from '../crewai/types/communication';

export class AgentMessagingService {
  private static instance: AgentMessagingService;
  private messageQueue: QueuedMessage[] = [];
  private config: MessageQueueConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    timeoutDuration: 5000,
    maxQueueSize: 100
  };

  private constructor() {
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

      this.messageQueue = data.map(msg => ({
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
        maxRetries: this.config.maxRetries
      }));
    } catch (error) {
      console.error('[AgentMessagingService] Error loading persisted messages:', error);
    }
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      this.processMessageQueue();
    }, 1000);
  }

  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    const message = this.messageQueue[0];
    if (await this.deliverMessage(message)) {
      this.messageQueue.shift();
    } else if (message.retryCount >= message.maxRetries) {
      await this.handleFailedDelivery(message);
      this.messageQueue.shift();
    } else {
      message.retryCount++;
      message.deliveryStatus.attempts++;
      // Move to end of queue for retry
      this.messageQueue.push(this.messageQueue.shift()!);
    }
  }

  private async deliverMessage(message: QueuedMessage): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_communications')
        .insert({
          sender_id: message.sender,
          receiver_id: message.receiver,
          message_type: message.type,
          content: message.content,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      message.deliveryStatus = {
        delivered: true,
        timestamp: new Date(),
        attempts: message.deliveryStatus.attempts + 1
      };

      await this.acknowledgeMessage(message);
      return true;
    } catch (error) {
      console.error('[AgentMessagingService] Message delivery error:', error);
      return false;
    }
  }

  private async acknowledgeMessage(message: QueuedMessage): Promise<void> {
    try {
      const acknowledgment: MessageAcknowledgment = {
        messageId: message.id,
        receiverId: message.receiver,
        timestamp: new Date(),
        status: 'received'
      };

      const { error } = await supabase
        .from('agent_communications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', message.id);

      if (error) throw error;
      message.acknowledgment = acknowledgment;
    } catch (error) {
      console.error('[AgentMessagingService] Acknowledgment error:', error);
    }
  }

  private async handleFailedDelivery(message: QueuedMessage): Promise<void> {
    try {
      await supabase
        .from('agent_communications')
        .insert({
          sender_id: message.sender,
          receiver_id: message.receiver,
          message_type: 'FAILED_DELIVERY',
          content: {
            originalMessage: message,
            error: 'Maximum retry attempts exceeded'
          },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('[AgentMessagingService] Failed delivery handling error:', error);
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
      if (this.messageQueue.length >= this.config.maxQueueSize) {
        throw new Error('Message queue is full');
      }

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
        maxRetries: this.config.maxRetries
      };

      this.messageQueue.push(message);
      return true;
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
      queueLength: this.messageQueue.length,
      processingMessage: this.messageQueue[0]
    };
  }
}