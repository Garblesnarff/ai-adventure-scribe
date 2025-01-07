import { QueuedMessage, MessageQueueConfig } from '../types';

export class MessageQueueService {
  private static instance: MessageQueueService;
  private messageQueue: QueuedMessage[] = [];
  private config: MessageQueueConfig;

  private constructor() {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeoutDuration: 5000,
      maxQueueSize: 100
    };
  }

  public static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService();
    }
    return MessageQueueService.instance;
  }

  public enqueue(message: QueuedMessage): boolean {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      return false;
    }
    this.messageQueue.push(message);
    return true;
  }

  public dequeue(): QueuedMessage | undefined {
    return this.messageQueue.shift();
  }

  public peek(): QueuedMessage | undefined {
    return this.messageQueue[0];
  }

  public getQueueLength(): number {
    return this.messageQueue.length;
  }

  public clear(): void {
    this.messageQueue = [];
  }

  public getConfig(): MessageQueueConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MessageQueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}