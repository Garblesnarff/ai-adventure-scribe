import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { TypeConverter } from './TypeConverter';
import { MessageSequence, SyncState, VectorClock, SyncStatus } from '../types';

export class DatabaseAdapter {
  static async saveMessageSequence(sequence: MessageSequence): Promise<void> {
    await supabase
      .from('message_sequences')
      .insert({
        message_id: sequence.messageId,
        sequence_number: sequence.sequenceNumber,
        vector_clock: TypeConverter.toJson(sequence.vectorClock)
      });
  }

  static async updateSyncStatus(
    agentId: string,
    syncState: SyncState,
    vectorClock: VectorClock
  ): Promise<void> {
    await supabase
      .from('sync_status')
      .upsert({
        agent_id: agentId,
        last_sync_timestamp: new Date().toISOString(),
        sync_state: TypeConverter.toJson(syncState),
        vector_clock: TypeConverter.toJson(vectorClock)
      });
  }

  static async getMessageSequence(messageId: string): Promise<MessageSequence | null> {
    const { data, error } = await supabase
      .from('message_sequences')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error || !data) return null;
    return TypeConverter.messageSequenceFromDb(data);
  }

  static async getSyncStatus(agentId: string): Promise<SyncStatus | null> {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error || !data) return null;
    return TypeConverter.syncStatusFromDb(data);
  }

  static async getMessageById(messageId: string): Promise<any> {
    const { data, error } = await supabase
      .from('agent_communications')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error || !data) return null;
    return TypeConverter.queuedMessageFromDb(data);
  }
}