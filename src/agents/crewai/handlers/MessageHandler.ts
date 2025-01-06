import { AgentMessage, MessageType, MessagePriority } from '../types/communication';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles message passing between agents with priority queue
 */
export class MessageHandler {
  private messageQueue: AgentMessage[] = [];
  private isProcessing: boolean = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

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
   * Processes messages in the queue based on priority
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    try {
      this.isProcessing = true;
      
      // Sort messages by priority
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
   * Processes a single message with retry logic
   */
  private async processMessage(message: AgentMessage): Promise<void> {
    let retries = 0;

    while (retries < this.MAX_RETRIES) {
      try {
        console.log('[MessageHandler] Processing message:', message);

        switch (message.type) {
          case MessageType.TASK:
            await this.handleTaskMessage(message);
            break;
          case MessageType.RESULT:
            await this.handleResultMessage(message);
            break;
          case MessageType.QUERY:
            await this.handleQueryMessage(message);
            break;
          case MessageType.RESPONSE:
            await this.handleResponseMessage(message);
            break;
          case MessageType.STATE_UPDATE:
            await this.handleStateUpdateMessage(message);
            break;
        }

        return;
      } catch (error) {
        console.error(`[MessageHandler] Error processing message (attempt ${retries + 1}):`, error);
        retries++;
        if (retries < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retries));
        }
      }
    }

    throw new Error(`Failed to process message after ${this.MAX_RETRIES} attempts`);
  }

  /**
   * Handle different message types
   */
  private async handleTaskMessage(message: AgentMessage): Promise<void> {
    // Implement task delegation logic
    console.log('[MessageHandler] Handling task message:', message);
  }

  private async handleResultMessage(message: AgentMessage): Promise<void> {
    // Implement result processing logic
    console.log('[MessageHandler] Handling result message:', message);
  }

  private async handleQueryMessage(message: AgentMessage): Promise<void> {
    // Implement query handling logic
    console.log('[MessageHandler] Handling query message:', message);
  }

  private async handleResponseMessage(message: AgentMessage): Promise<void> {
    // Implement response processing logic
    console.log('[MessageHandler] Handling response message:', message);
  }

  private async handleStateUpdateMessage(message: AgentMessage): Promise<void> {
    // Implement state update logic
    console.log('[MessageHandler] Handling state update message:', message);
  }
}