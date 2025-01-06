import { supabase } from '@/integrations/supabase/client';
import { BaseMessageService } from './BaseMessageService';
import { TaskMessagePayload } from '../types/messages';
import { MessageType } from '../types/communication';

export class TaskMessageService extends BaseMessageService {
  public async handleTaskMessage(payload: TaskMessagePayload): Promise<void> {
    try {
      console.log('[TaskMessageService] Processing task message:', payload);

      const taskData = {
        task_type: 'agent_task',
        priority: payload.priority,
        data: JSON.stringify({
          task: {
            id: payload.task.id,
            description: payload.task.description,
            expectedOutput: payload.task.expectedOutput,
            context: payload.task.context
          },
          delegatedBy: payload.delegatedBy,
          requiredCapabilities: payload.requiredCapabilities
        }),
        assigned_agent_id: payload.receiver,
        status: 'pending'
      };

      const { error } = await supabase
        .from('task_queue')
        .insert(taskData);

      if (error) throw error;

      // Notify receiver
      await this.notifyAgent(payload.receiver!, {
        type: MessageType.TASK,
        content: payload
      });

    } catch (error) {
      console.error('[TaskMessageService] Error handling task message:', error);
      await this.storeFailedMessage('task', payload, error);
      throw error;
    }
  }
}