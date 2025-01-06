import { supabase } from '@/integrations/supabase/client';
import { BaseMessageService } from './BaseMessageService';
import { ResultMessagePayload } from '../types/messages';

export class ResultMessageService extends BaseMessageService {
  public async handleResultMessage(payload: ResultMessagePayload): Promise<void> {
    try {
      console.log('[ResultMessageService] Processing result message:', payload);

      const { error } = await supabase
        .from('task_queue')
        .update({
          status: payload.success ? 'completed' : 'failed',
          result: JSON.stringify(payload.data),
          error: payload.error,
          completed_at: new Date().toISOString()
        })
        .eq('id', payload.taskId);

      if (error) throw error;

      if (payload.success && payload.data) {
        await this.storeResultInMemory(payload);
      }

    } catch (error) {
      console.error('[ResultMessageService] Error handling result message:', error);
      await this.storeFailedMessage('result', payload, error);
      throw error;
    }
  }

  private async storeResultInMemory(payload: ResultMessagePayload): Promise<void> {
    try {
      await supabase
        .from('memories')
        .insert({
          type: 'task_result',
          content: JSON.stringify(payload.data),
          importance: 5,
          metadata: JSON.stringify({
            taskId: payload.taskId,
            executionTime: payload.executionTime
          })
        });
    } catch (error) {
      console.error('[ResultMessageService] Error storing result in memory:', error);
    }
  }
}