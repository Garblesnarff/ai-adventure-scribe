import { supabase } from '@/integrations/supabase/client';
import { MessageQueueService } from '../MessageQueueService';
import { MessagePersistenceService } from '../storage/MessagePersistenceService';
import { OfflineStateService } from '../offline/OfflineStateService';
import { ConnectionState, ConnectionEvent, ReconnectionConfig, QueuedMessage } from '../../types';
import { EventEmitter } from './EventEmitter';

export class ConnectionStateService {
  private static instance: ConnectionStateService;
  private queueService: MessageQueueService;
  private persistenceService: MessagePersistenceService;
  private offlineService: OfflineStateService;
  private eventEmitter: EventEmitter;
  private reconnectionAttempts: number = 0;
  private maxReconnectionAttempts: number = 10;
  private reconnectionTimer: NodeJS.Timeout | null = null;
  private state: ConnectionState = {
    status: 'disconnected',
    lastConnected: null,
    lastDisconnected: null,
    reconnecting: false
  };

  private config: ReconnectionConfig = {
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2,
    jitter: true
  };

  private constructor() {
    this.queueService = MessageQueueService.getInstance();
    this.persistenceService = MessagePersistenceService.getInstance();
    this.offlineService = OfflineStateService.getInstance();
    this.eventEmitter = new EventEmitter();
    this.initializeListeners();
  }

  public static getInstance(): ConnectionStateService {
    if (!ConnectionStateService.instance) {
      ConnectionStateService.instance = new ConnectionStateService();
    }
    return ConnectionStateService.instance;
  }

  private initializeListeners(): void {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        this.handleOnline();
      } else if (event === 'SIGNED_OUT') {
        this.handleOffline();
      }
    });
  }

  private async handleOnline(): Promise<void> {
    console.log('[ConnectionStateService] Connection restored');
    
    this.state = {
      ...this.state,
      status: 'connected',
      lastConnected: new Date(),
      reconnecting: false
    };

    this.eventEmitter.emit('connectionStateChanged', this.state);
    await this.handleReconnection();
  }

  private async handleOffline(): Promise<void> {
    console.log('[ConnectionStateService] Connection lost');
    
    this.state = {
      ...this.state,
      status: 'disconnected',
      lastDisconnected: new Date(),
      reconnecting: false
    };

    this.eventEmitter.emit('connectionStateChanged', this.state);
    this.startReconnection();
  }

  private calculateBackoffDelay(): number {
    const { initialDelay, maxDelay, factor, jitter } = this.config;
    let delay = initialDelay * Math.pow(factor, this.reconnectionAttempts);
    
    if (jitter) {
      delay = delay * (0.5 + Math.random());
    }
    
    return Math.min(delay, maxDelay);
  }

  private startReconnection(): void {
    if (this.state.reconnecting) return;

    this.state.reconnecting = true;
    this.reconnectionAttempts = 0;
    this.attemptReconnection();
  }

  private attemptReconnection(): void {
    if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
      console.error('[ConnectionStateService] Max reconnection attempts reached');
      this.state.reconnecting = false;
      this.eventEmitter.emit('reconnectionFailed', {
        attempts: this.reconnectionAttempts,
        lastAttempt: new Date()
      });
      return;
    }

    const delay = this.calculateBackoffDelay();
    console.log(`[ConnectionStateService] Attempting reconnection in ${delay}ms`);

    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
    }

    this.reconnectionTimer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          throw new Error('Failed to reconnect');
        }

        await this.handleReconnection();
        this.state.reconnecting = false;
        this.reconnectionAttempts = 0;
        
      } catch (error) {
        console.error('[ConnectionStateService] Reconnection attempt failed:', error);
        this.reconnectionAttempts++;
        this.attemptReconnection();
      }
    }, delay);
  }

  private async handleReconnection(): Promise<void> {
    try {
      const isValid = await this.queueService.validateQueue();
      if (!isValid) {
        console.warn('[ConnectionStateService] Queue validation failed, initiating recovery...');
        await this.persistenceService.cleanupOldMessages();
      }

      const pendingMessages = await this.persistenceService.getUnsentMessages();
      for (const message of pendingMessages) {
        const queuedMessage: QueuedMessage = {
          ...message,
          deliveryStatus: {
            delivered: false,
            timestamp: new Date(),
            attempts: 0
          },
          retryCount: 0,
          maxRetries: this.queueService.getConfig().maxRetries
        };
        await this.queueService.enqueue(queuedMessage);
      }

      await this.offlineService.setOnline(true);
      
      this.eventEmitter.emit('reconnectionSuccessful', {
        timestamp: new Date(),
        pendingMessages: pendingMessages.length
      });

    } catch (error) {
      console.error('[ConnectionStateService] Error handling reconnection:', error);
      this.eventEmitter.emit('reconnectionError', {
        error,
        timestamp: new Date()
      });
    }
  }

  public getState(): ConnectionState {
    return { ...this.state };
  }

  public onConnectionStateChanged(callback: (state: ConnectionState) => void): void {
    this.eventEmitter.on('connectionStateChanged', callback);
  }

  public onReconnectionFailed(callback: (data: any) => void): void {
    this.eventEmitter.on('reconnectionFailed', callback);
  }

  public onReconnectionSuccessful(callback: (data: any) => void): void {
    this.eventEmitter.on('reconnectionSuccessful', callback);
  }

  public onReconnectionError(callback: (data: any) => void): void {
    this.eventEmitter.on('reconnectionError', callback);
  }
}