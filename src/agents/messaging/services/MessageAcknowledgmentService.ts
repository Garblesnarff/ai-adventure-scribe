import { supabase } from '@/integrations/supabase/client';
import { MessageAcknowledgment } from '../types';

export class MessageAcknowledgmentService {
  private static instance: MessageAcknowledgmentService;

  private constructor() {}

  public static getInstance(): MessageAcknowledgmentService {
    if (!MessageAcknowledgmentService.instance) {
      MessageAcknowledgmentService.instance = new MessageAcknowledgmentService();
    }
    return MessageAcknowledgmentService.instance;
  }

  public async createAcknowledgment(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('message_acknowledgments')
        .insert({
          message_id: messageId,
          timeout_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minute timeout
        });

      if (error) throw error;
    } catch (error) {
      console.error('[MessageAcknowledgmentService] Create acknowledgment error:', error);
      throw error;
    }
  }

  public async updateAcknowledgment(
    messageId: string, 
    status: 'received' | 'processed' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      const updates: Record<string, any> = {
        status,
        attempts: 1, // We'll increment this using a counter
        last_attempt: new Date().toISOString(),
      };

      if (status === 'processed') {
        updates.acknowledged_at = new Date().toISOString();
      }

      if (error) {
        updates.error = error;
      }

      const { error: updateError } = await supabase
        .from('message_acknowledgments')
        .update(updates)
        .eq('message_id', messageId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('[MessageAcknowledgmentService] Update acknowledgment error:', error);
      throw error;
    }
  }

  public async checkAcknowledgmentStatus(messageId: string): Promise<MessageAcknowledgment | null> {
    try {
      const { data, error } = await supabase
        .from('message_acknowledgments')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        messageId: data.message_id,
        receiverId: data.receiver_id || '',
        timestamp: new Date(data.created_at || Date.now()),
        status: data.status as MessageAcknowledgment['status']
      };
    } catch (error) {
      console.error('[MessageAcknowledgmentService] Check status error:', error);
      return null;
    }
  }

  public async handleTimeout(messageId: string): Promise<void> {
    try {
      const { data: ack } = await supabase
        .from('message_acknowledgments')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (ack && ack.status === 'pending' && new Date(ack.timeout_at) <= new Date()) {
        await this.updateAcknowledgment(messageId, 'failed', 'Message acknowledgment timeout');
      }
    } catch (error) {
      console.error('[MessageAcknowledgmentService] Handle timeout error:', error);
    }
  }
}