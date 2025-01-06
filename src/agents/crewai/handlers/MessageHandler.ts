import { AgentMessage, MessageType, MessagePriority } from '../types/communication';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles message passing between agents
 */
export class MessageHandler {
  private messageQueue: AgentMessage[] = [];
  private isProcessing: boolean = false;

  /**
   * Sends a message to another agent
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    try {
      console.log('[MessageHandler] Sending message:', message);

      const { error } = await supabase
        .from('agent_communications')
        .insert([{
          sender_id: message.metadata?.sender,
          receiver_id: message.metadata?.receiver,
          message_type: message.type,
          content: message.content,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Add to queue for processing
      this.messageQueue.push(message);
      this.processQueue();

    } catch (error) {
      console.error('[MessageHandler] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Processes messages in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    try {
      this.isProcessing = true;
      
      // Process messages by priority
      const sortedMessages = [...this.messageQueue].sort((a, b) => {
        const priorityOrder = {
          [MessagePriority.HIGH]: 0,
          [MessagePriority.MEDIUM]: 1,
          [MessagePriority.LOW]: 2
        };
        return (priorityOrder[a.metadata?.priority || MessagePriority.LOW] || 2) -
               (priorityOrder[b.metadata?.priority || MessagePriority.LOW] || 2);
      });

      for (const message of sortedMessages) {
        await this.processMessage(message);
        this.messageQueue = this.messageQueue.filter(m => m !== message);
      }

    } catch (error) {
      console.error('[MessageHandler] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
      
      // Check for more messages
      if (this.messageQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Processes a single message
   */
  private async processMessage(message: AgentMessage): Promise<void> {
    try {
      console.log('[MessageHandler] Processing message:', message);

      // Handle different message types
      switch (message.type) {
        case MessageType.TASK:
          // Handle task delegation
          break;
        case MessageType.RESULT:
          // Handle task results
          break;
        case MessageType.QUERY:
          // Handle information queries
          break;
        case MessageType.RESPONSE:
          // Handle responses
          break;
        case MessageType.STATE_UPDATE:
          // Handle state updates
          break;
      }

    } catch (error) {
      console.error('[MessageHandler] Error processing message:', error);
      throw error;
    }
  }
}