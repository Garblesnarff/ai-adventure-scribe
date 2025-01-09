import { ErrorCategory, ErrorSeverity, ErrorMetadata } from '../types';
import { CircuitBreakerService } from './CircuitBreakerService';
import { RetryService } from './RetryService';
import { RecoveryService } from './RecoveryService';
import { ErrorTrackingService } from './ErrorTrackingService';
import { useToast } from '@/hooks/use-toast';

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private circuitBreaker: CircuitBreakerService;
  private retryService: RetryService;
  private recoveryService: RecoveryService;
  private trackingService: ErrorTrackingService;

  private constructor() {
    this.circuitBreaker = new CircuitBreakerService();
    this.retryService = new RetryService();
    this.recoveryService = new RecoveryService();
    this.trackingService = new ErrorTrackingService();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  public async handleError(
    error: Error,
    category: ErrorCategory,
    context: string,
    metadata?: ErrorMetadata
  ): Promise<void> {
    console.error(`[ErrorHandlingService] Error in ${context}:`, error);

    // Track error
    await this.trackingService.trackError(error, category, context, metadata);

    // Check circuit breaker
    if (this.circuitBreaker.isOpen(context)) {
      console.warn(`[ErrorHandlingService] Circuit breaker open for ${context}`);
      throw new Error(`Service unavailable: ${context}`);
    }

    // Determine severity and recovery strategy
    const severity = this.determineSeverity(error, category);
    const shouldRetry = this.shouldRetryError(error, category, severity);

    if (shouldRetry) {
      return this.retryService.handleRetry(
        async () => { throw error; },
        context,
        metadata
      );
    }

    // Attempt recovery for severe errors
    if (severity === ErrorSeverity.HIGH) {
      await this.recoveryService.attemptRecovery(context, error, metadata);
    }

    // Update circuit breaker state
    this.circuitBreaker.recordError(context);

    // Show user notification if needed
    if (severity >= ErrorSeverity.MEDIUM) {
      const { toast } = useToast();
      toast({
        title: "Error",
        description: this.getUserFriendlyMessage(error, category),
        variant: "destructive",
      });
    }
  }

  private determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    switch (category) {
      case ErrorCategory.NETWORK:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.DATABASE:
        return ErrorSeverity.HIGH;
      case ErrorCategory.VALIDATION:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  private shouldRetryError(
    error: Error,
    category: ErrorCategory,
    severity: ErrorSeverity
  ): boolean {
    // Don't retry validation errors
    if (category === ErrorCategory.VALIDATION) {
      return false;
    }

    // Always retry network errors
    if (category === ErrorCategory.NETWORK) {
      return true;
    }

    // Retry other errors based on severity
    return severity >= ErrorSeverity.MEDIUM;
  }

  private getUserFriendlyMessage(error: Error, category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.NETWORK:
        return "Connection error. Please check your internet connection.";
      case ErrorCategory.DATABASE:
        return "Database error. Please try again later.";
      case ErrorCategory.VALIDATION:
        return error.message;
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }
}