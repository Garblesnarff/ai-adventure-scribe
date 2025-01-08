import { IndexedDBService } from '../storage/IndexedDBService';
import { MessageQueueService } from '../MessageQueueService';
import { MessagePersistenceService } from '../storage/MessagePersistenceService';
import { MessageRecoveryService } from '../recovery/MessageRecoveryService';
import { QueueStateManager } from '../queue/QueueStateManager';

export interface OfflineState {
  isOnline: boolean;
  lastOnlineTimestamp: string;
  lastOfflineTimestamp: string;
  pendingSync: boolean;
  queueSize: number;
  reconnectionAttempts: number;
}

export class OfflineStateService {
  private static instance: OfflineStateService;
  private storage: IndexedDBService;
  private queueService: MessageQueueService;
  private persistenceService: MessagePersistenceService;
  private recoveryService: MessageRecoveryService;
  private stateManager: QueueStateManager;
  private state: OfflineState;
  private reconnectionTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.storage = IndexedDBService.getInstance();
    this.queueService = MessageQueueService.getInstance();
    this.persistenceService = MessagePersistenceService.getInstance();
    this.recoveryService = MessageRecoveryService.getInstance();
    this.stateManager = QueueStateManager.getInstance();
    
    this.state = {
      isOnline: navigator.onLine,
      lastOnlineTimestamp: new Date().toISOString(),
      lastOfflineTimestamp: '',
      pendingSync: false,
      queueSize: 0,
      reconnectionAttempts: 0
    };

    this.initializeService();
  }

  public static getInstance(): OfflineStateService {
    if (!OfflineStateService.instance) {
      OfflineStateService.instance = new OfflineStateService();
    }
    return OfflineStateService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      // Restore previous state if exists
      const savedState = await this.storage.getOfflineState();
      if (savedState) {
        this.state = { ...this.state, ...savedState };
      }

      // Set up event listeners
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Initial state save
      await this.saveState();
      
      console.log('[OfflineStateService] Initialized with state:', this.state);
    } catch (error) {
      console.error('[OfflineStateService] Initialization error:', error);
    }
  }

  private async handleOnline(): Promise<void> {
    console.log('[OfflineStateService] Connection restored');
    
    this.state.isOnline = true;
    this.state.lastOnlineTimestamp = new Date().toISOString();
    this.state.pendingSync = true;
    
    await this.saveState();
    await this.synchronize();
  }

  private async handleOffline(): Promise<void> {
    console.log('[OfflineStateService] Connection lost');
    
    this.state.isOnline = false;
    this.state.lastOfflineTimestamp = new Date().toISOString();
    this.state.pendingSync = false;
    
    await this.saveState();
    this.startReconnectionAttempts();
  }

  private async synchronize(): Promise<void> {
    try {
      // Validate queue state
      const isValid = await this.queueService.validateQueue();
      if (!isValid) {
        console.warn('[OfflineStateService] Queue validation failed, initiating recovery...');
        await this.recoveryService.recoverMessages();
      }

      // Process pending messages
      const pendingMessages = await this.persistenceService.getUnsentMessages();
      for (const message of pendingMessages) {
        await this.queueService.enqueue(message);
      }

      this.state.pendingSync = false;
      this.state.reconnectionAttempts = 0;
      await this.saveState();

      console.log('[OfflineStateService] Synchronization complete');
    } catch (error) {
      console.error('[OfflineStateService] Synchronization error:', error);
      this.state.pendingSync = true;
      await this.saveState();
    }
  }

  private startReconnectionAttempts(): void {
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
    }

    const backoffTime = Math.min(1000 * Math.pow(2, this.state.reconnectionAttempts), 30000);
    
    this.reconnectionTimeout = setTimeout(async () => {
      if (!this.state.isOnline) {
        this.state.reconnectionAttempts++;
        await this.saveState();
        this.startReconnectionAttempts();
      }
    }, backoffTime);
  }

  private async saveState(): Promise<void> {
    try {
      await this.storage.saveOfflineState(this.state);
    } catch (error) {
      console.error('[OfflineStateService] Error saving state:', error);
    }
  }

  public getState(): OfflineState {
    return { ...this.state };
  }

  public isOnline(): boolean {
    return this.state.isOnline;
  }

  public isPendingSync(): boolean {
    return this.state.pendingSync;
  }

  public getQueueSize(): number {
    return this.queueService.getQueueLength();
  }
}