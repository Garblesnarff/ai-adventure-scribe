import { QueuedMessage, MessageQueueConfig } from '../../types';
import { IndexedDBService } from '../storage/IndexedDBService';

export class QueueStateManager {
  private static instance: QueueStateManager;
  private storage: IndexedDBService;
  private queueMetrics: {
    totalProcessed: number;
    failedDeliveries: number;
    avgProcessingTime: number;
  };

  private constructor() {
    this.storage = IndexedDBService.getInstance();
    this.queueMetrics = {
      totalProcessed: 0,
      failedDeliveries: 0,
      avgProcessingTime: 0
    };
  }

  public static getInstance(): QueueStateManager {
    if (!QueueStateManager.instance) {
      QueueStateManager.instance = new QueueStateManager();
    }
    return QueueStateManager.instance;
  }

  public async saveQueueSnapshot(messages: QueuedMessage[]): Promise<void> {
    try {
      const snapshot = {
        timestamp: new Date().toISOString(),
        messages: messages,
        metrics: this.queueMetrics
      };
      await this.storage.saveQueueState(snapshot);
      console.log('[QueueStateManager] Queue snapshot saved:', snapshot.timestamp);
    } catch (error) {
      console.error('[QueueStateManager] Failed to save queue snapshot:', error);
      throw error;
    }
  }

  public async validateQueueState(currentMessages: QueuedMessage[]): Promise<boolean> {
    try {
      const storedState = await this.storage.getQueueState();
      if (!storedState) return true;

      const currentIds = new Set(currentMessages.map(msg => msg.id));
      const storedIds = new Set(storedState.messages.map(msg => msg.id));

      const missingMessages = [...storedIds].filter(id => !currentIds.has(id));
      if (missingMessages.length > 0) {
        console.warn('[QueueStateManager] Found missing messages:', missingMessages);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[QueueStateManager] Queue validation error:', error);
      return false;
    }
  }

  public updateMetrics(processingTime: number, success: boolean): void {
    this.queueMetrics.totalProcessed++;
    if (!success) {
      this.queueMetrics.failedDeliveries++;
    }
    
    // Update average processing time
    const oldTotal = this.queueMetrics.avgProcessingTime * (this.queueMetrics.totalProcessed - 1);
    this.queueMetrics.avgProcessingTime = (oldTotal + processingTime) / this.queueMetrics.totalProcessed;
  }

  public getMetrics() {
    return { ...this.queueMetrics };
  }
}