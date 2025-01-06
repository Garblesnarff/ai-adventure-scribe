import { supabase } from '@/integrations/supabase/client';
import { BaseMessageService } from './BaseMessageService';
import { QueryMessagePayload } from '../types/messages';
import { MessageType } from '../types/communication';

export class QueryMessageService extends BaseMessageService {
  public async handleQueryMessage(payload: QueryMessagePayload): Promise<void> {
    try {
      console.log('[QueryMessageService] Processing query message:', payload);

      const communicationData = {
        sender_id: payload.sender,
        receiver_id: payload.receiver,
        message_type: MessageType.QUERY,
        content: JSON.stringify(payload)
      };

      const { error } = await supabase
        .from('agent_communications')
        .insert(communicationData);

      if (error) throw error;

      const response = await this.routeQuery(payload);
      await this.sendResponse(payload.sender, response);

    } catch (error) {
      console.error('[QueryMessageService] Error handling query message:', error);
      await this.storeFailedMessage('query', payload, error);
      throw error;
    }
  }

  private async routeQuery(payload: QueryMessagePayload): Promise<any> {
    return {
      queryId: payload.queryId,
      status: 'success',
      data: { message: 'Query processed' }
    };
  }

  private async sendResponse(agentId: string, response: any): Promise<void> {
    await this.notifyAgent(agentId, {
      type: MessageType.RESPONSE,
      content: response
    });
  }
}