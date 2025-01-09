import { supabase } from '@/integrations/supabase/client';
import { QueuedMessage } from './types';
import { MessageQueueService } from '../MessageQueueService';
import { ConnectionStateService } from '../connection/ConnectionStateService';
import { OfflineStateService } from '../offline/OfflineStateService';
import { VectorClock, SyncState, MessageSequence, SyncStatus, MessageSyncOptions, ConflictResolutionStrategy } from './types';
import { Json } from '@/integrations/supabase/types';

export class MessageSynchronizationService {
  private static instance: MessageSynchronizationService;
  private queueService: MessageQueueService;
  private connectionService: ConnectionStateService;
  private offlineService: OfflineStateService;
  private vectorClock: VectorClock = {};
  private syncInterval: NodeJS.Timeout | null = null;

  private defaultOptions: MessageSyncOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    consistencyCheckInterval: 5000,
    conflictStrategy: {
      type: 'timestamp',
      resolve: (messages) => messages.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]
    }
  };

  private constructor() {
    this.queueService = MessageQueueService.getInstance();
    this.connectionService = ConnectionStateService.getInstance();
    this.offlineService = OfflineStateService.getInstance();
    this.initializeService();
  }

  public static getInstance(): MessageSynchronizationService {
    if (!MessageSynchronizationService.instance) {
      MessageSynchronizationService.instance = new MessageSynchronizationService();
    }
    return MessageSynchronizationService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadVectorClock();
      this.startConsistencyChecks();
      this.listenToConnectionChanges();
      console.log('[MessageSynchronizationService] Initialized successfully');
    } catch (error) {
      console.error('[MessageSynchronizationService] Initialization error:', error);
    }
  }

  private async loadVectorClock(): Promise<void> {
    const { data: syncStatus, error } = await supabase
      .from('sync_status')
      .select('vector_clock')
      .single();

    if (error) {
      console.error('[MessageSynchronizationService] Error loading vector clock:', error);
      return;
    }

    this.vectorClock = (syncStatus?.vector_clock as VectorClock) || {};
  }

  private startConsistencyChecks(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(
      () => this.performConsistencyCheck(),
      this.defaultOptions.consistencyCheckInterval
    );
  }

  private listenToConnectionChanges(): void {
    this.connectionService.onConnectionStateChanged(async (state) => {
      if (state.status === 'connected') {
        await this.synchronizeMessages();
      }
    });
  }

  public async synchronizeMessage(message: QueuedMessage): Promise<boolean> {
    try {
      const agentId = message.sender;
      this.vectorClock[agentId] = (this.vectorClock[agentId] || 0) + 1;

      const sequence: Omit<MessageSequence, 'id' | 'createdAt' | 'updatedAt'> = {
        messageId: message.id,
        sequenceNumber: this.vectorClock[agentId],
        vectorClock: { ...this.vectorClock },
      };

      const { error } = await supabase
        .from('message_sequences')
        .insert({
          message_id: sequence.messageId,
          sequence_number: sequence.sequenceNumber,
          vector_clock: sequence.vectorClock as Json
        });

      if (error) {
        console.error('[MessageSynchronizationService] Error saving sequence:', error);
        return false;
      }

      await this.updateSyncStatus(agentId);
      return true;
    } catch (error) {
      console.error('[MessageSynchronizationService] Synchronization error:', error);
      return false;
    }
  }

  private async updateSyncStatus(agentId: string): Promise<void> {
    const syncState: SyncState = {
      lastSequenceNumber: this.vectorClock[agentId] || 0,
      vectorClock: { ...this.vectorClock },
      pendingMessages: this.queueService.getQueueIds(),
      conflicts: []
    };

    const { error } = await supabase
      .from('sync_status')
      .upsert({
        agent_id: agentId,
        last_sync_timestamp: new Date().toISOString(),
        sync_state: syncState as Json,
        vector_clock: this.vectorClock as Json
      });

    if (error) {
      console.error('[MessageSynchronizationService] Error updating sync status:', error);
    }
  }

  private async synchronizeMessages(): Promise<void> {
    if (!this.offlineService.isOnline()) {
      return;
    }

    try {
      const { data: sequences, error } = await supabase
        .from('message_sequences')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      for (const sequence of sequences) {
        await this.processMessageSequence(sequence);
      }

      console.log('[MessageSynchronizationService] Messages synchronized successfully');
    } catch (error) {
      console.error('[MessageSynchronizationService] Synchronization error:', error);
    }
  }

  private async processMessageSequence(sequence: MessageSequence): Promise<void> {
    const hasConflict = this.detectConflict(sequence.vectorClock);
    if (hasConflict) {
      await this.handleConflict(sequence);
    } else {
      Object.entries(sequence.vectorClock).forEach(([agentId, count]) => {
        this.vectorClock[agentId] = Math.max(
          this.vectorClock[agentId] || 0,
          count
        );
      });
    }
  }

  private detectConflict(incomingClock: VectorClock): boolean {
    return Object.entries(incomingClock).some(([agentId, count]) => {
      const localCount = this.vectorClock[agentId] || 0;
      return count < localCount;
    });
  }

  private async handleConflict(sequence: MessageSequence): Promise<void> {
    try {
      const { data: messages, error } = await supabase
        .from('agent_communications')
        .select('*')
        .eq('id', sequence.messageId)
        .single();

      if (error || !messages) {
        throw error;
      }

      const resolvedMessage = this.defaultOptions.conflictStrategy!.resolve([messages]);
      
      await supabase
        .from('agent_communications')
        .update(resolvedMessage)
        .eq('id', sequence.messageId);

      console.log('[MessageSynchronizationService] Conflict resolved:', sequence.messageId);
    } catch (error) {
      console.error('[MessageSynchronizationService] Conflict resolution error:', error);
    }
  }

  private async performConsistencyCheck(): Promise<void> {
    if (!this.offlineService.isOnline()) {
      return;
    }

    try {
      const { data: sequences, error } = await supabase
        .from('message_sequences')
        .select('*')
        .order('sequence_number', { ascending: true });

      if (error) {
        throw error;
      }

      let isConsistent = true;
      let lastSequence = 0;

      for (const sequence of sequences) {
        if (sequence.sequence_number !== lastSequence + 1) {
          isConsistent = false;
          console.warn(
            '[MessageSynchronizationService] Consistency check failed:',
            `Expected ${lastSequence + 1}, got ${sequence.sequence_number}`
          );
          break;
        }
        lastSequence = sequence.sequence_number;
      }

      if (!isConsistent) {
        await this.synchronizeMessages();
      }
    } catch (error) {
      console.error('[MessageSynchronizationService] Consistency check error:', error);
    }
  }

  public async getMessageSequence(messageId: string): Promise<MessageSequence | null> {
    try {
      const { data, error } = await supabase
        .from('message_sequences')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        messageId: data.message_id,
        sequenceNumber: data.sequence_number,
        vectorClock: data.vector_clock as VectorClock,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('[MessageSynchronizationService] Error getting message sequence:', error);
      return null;
    }
  }

  public async getSyncStatus(agentId: string): Promise<SyncStatus | null> {
    try {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        agentId: data.agent_id,
        lastSyncTimestamp: data.last_sync_timestamp,
        syncState: data.sync_state as SyncState,
        vectorClock: data.vector_clock as VectorClock,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('[MessageSynchronizationService] Error getting sync status:', error);
      return null;
    }
  }
}
