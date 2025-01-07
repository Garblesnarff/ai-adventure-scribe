import { StoredMessage, QueueState, StorageConfig } from './types';

export class IndexedDBService {
  private static instance: IndexedDBService;
  private db: IDBDatabase | null = null;
  private readonly config: StorageConfig = {
    dbName: 'agentMessaging',
    messageStoreName: 'messages',
    queueStoreName: 'queueState',
    version: 1,
  };

  private constructor() {
    this.initDatabase();
  }

  public static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create messages store
        if (!db.objectStoreNames.contains(this.config.messageStoreName)) {
          const messageStore = db.createObjectStore(this.config.messageStoreName, { keyPath: 'id' });
          messageStore.createIndex('status', 'status', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create queue state store
        if (!db.objectStoreNames.contains(this.config.queueStoreName)) {
          db.createObjectStore(this.config.queueStoreName, { keyPath: 'id' });
        }
      };
    });
  }

  public async storeMessage(message: StoredMessage): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.messageStoreName], 'readwrite');
      const store = transaction.objectStore(this.config.messageStoreName);
      const request = store.put(message);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[IndexedDB] Message stored successfully:', message.id);
        resolve();
      };
    });
  }

  public async getMessage(id: string): Promise<StoredMessage | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.messageStoreName], 'readonly');
      const store = transaction.objectStore(this.config.messageStoreName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  public async updateMessageStatus(id: string, status: StoredMessage['status']): Promise<void> {
    const message = await this.getMessage(id);
    if (!message) {
      throw new Error(`Message ${id} not found`);
    }

    return this.storeMessage({ ...message, status });
  }

  public async getPendingMessages(): Promise<StoredMessage[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.messageStoreName], 'readonly');
      const store = transaction.objectStore(this.config.messageStoreName);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  public async saveQueueState(state: QueueState): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.queueStoreName], 'readwrite');
      const store = transaction.objectStore(this.config.queueStoreName);
      const request = store.put({ id: 'current', ...state });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[IndexedDB] Queue state saved successfully');
        resolve();
      };
    });
  }

  public async getQueueState(): Promise<QueueState | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.queueStoreName], 'readonly');
      const store = transaction.objectStore(this.config.queueStoreName);
      const request = store.get('current');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  public async clearOldMessages(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const cutoffTime = new Date(Date.now() - maxAgeMs).toISOString();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.messageStoreName], 'readwrite');
      const store = transaction.objectStore(this.config.messageStoreName);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log('[IndexedDB] Old messages cleared successfully');
          resolve();
        }
      };
    });
  }
}