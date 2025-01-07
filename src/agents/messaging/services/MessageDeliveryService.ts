import { supabase } from '@/integrations/supabase/client';
import { QueuedMessage } from '../types';
import { MessageAcknowledgmentService } from './MessageAcknowledgmentService';

export class MessageDeliveryService {
  private static instance: MessageDeliveryService;
  private acknowledgmentService: MessageAcknowledgmentService;

  private constructor() {
    this.acknowledgmentService = MessageAcknowledgmentService.getInstance();
  }

  public static getInstance(): MessageDeliveryService {
    if (!MessageDeliveryService.instance) {
      MessageDeliveryService.instance = new MessageDeliveryService();
    }
    return MessageDeliveryService.instance;
  }

  public async deliverMessage(message: QueuedMessage): Promise<boolean> {
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

      await this.acknowledgmentService.createAcknowledgment(message.id);
      
      message.deliveryStatus = {
        delivered: true,
        timestamp: new Date(),
        attempts: message.deliveryStatus.attempts + 1
      };

      return true;
    } catch (error) {
      console.error('[MessageDeliveryService] Delivery error:', error);
      message.deliveryStatus = {
        delivered: false,
        timestamp: new Date(),
        attempts: message.deliveryStatus.attempts + 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return false;
    }
  }

  public async confirmDelivery(messageId: string): Promise<void> {
    await this.acknowledgmentService.updateAcknowledgment(messageId, 'received');
  }

  public async handleFailedDelivery(message: QueuedMessage): Promise<void> {
    try {
      const failureContent = {
        originalMessageId: message.id,
        originalType: message.type,
        error: 'Maximum retry attempts exceeded',
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('agent_communications')
        .insert({
          sender_id: message.sender,
          receiver_id: message.receiver,
          message_type: 'FAILED_DELIVERY',
          content: failureContent,
          created_at: new Date().toISOString()
        });

      await this.acknowledgmentService.updateAcknowledgment(
        message.id,
        'failed',
        'Maximum retry attempts exceeded'
      );
    } catch (error) {
      console.error('[MessageDeliveryService] Failed delivery handling error:', error);
    }
  }
}