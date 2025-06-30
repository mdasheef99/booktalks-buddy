/**
 * Unified Error Management System for BookTalks Buddy
 * Provides consistent error handling, user messaging, and recovery strategies
 */

import { toast } from 'sonner';

export enum ErrorType {
  // Network & Connection
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  
  // Authentication & Authorization
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Database & API
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // File Operations
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_SIZE_ERROR = 'FILE_SIZE_ERROR',
  FILE_TYPE_ERROR = 'FILE_TYPE_ERROR',
  
  // Profile & Sync
  PROFILE_SYNC_ERROR = 'PROFILE_SYNC_ERROR',
  AVATAR_ERROR = 'AVATAR_ERROR',
  
  // UI & Component
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  FORM_ERROR = 'FORM_ERROR',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',       // Minor issues, app continues normally
  MEDIUM = 'MEDIUM', // Noticeable issues, some features affected
  HIGH = 'HIGH',     // Major issues, core functionality affected
  CRITICAL = 'CRITICAL' // App-breaking issues
}

export interface ErrorContext {
  userId?: string;
  operation?: string;
  component?: string;
  timestamp?: Date;
  retryAttempt?: number;
  metadata?: Record<string, any>;
}

export interface RecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<boolean>;
  description: string;
  maxRetries?: number;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly recoverable: boolean;
  public readonly userMessage: string;
  public readonly retryable: boolean;

  constructor(
    type: ErrorType,
    message: string,
    context: ErrorContext = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverable: boolean = true,
    retryable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = { ...context, timestamp: new Date() };
    this.recoverable = recoverable;
    this.retryable = retryable;
    this.userMessage = this.generateUserMessage();
  }

  private generateUserMessage(): string {
    const messages = {
      [ErrorType.NETWORK_ERROR]: 'Connection issue. Please check your internet and try again.',
      [ErrorType.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      [ErrorType.OFFLINE_ERROR]: 'You appear to be offline. Please check your connection.',
      [ErrorType.AUTH_ERROR]: 'Authentication failed. Please sign in again.',
      [ErrorType.PERMISSION_DENIED]: 'You don\'t have permission to perform this action.',
      [ErrorType.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
      [ErrorType.DATABASE_ERROR]: 'Database error. Please try again later.',
      [ErrorType.API_ERROR]: 'Service temporarily unavailable. Please try again.',
      [ErrorType.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorType.FILE_UPLOAD_ERROR]: 'File upload failed. Please try again.',
      [ErrorType.FILE_SIZE_ERROR]: 'File is too large. Please choose a smaller file.',
      [ErrorType.FILE_TYPE_ERROR]: 'Invalid file type. Please choose a different file.',
      [ErrorType.PROFILE_SYNC_ERROR]: 'Profile sync failed. Some changes may not be visible.',
      [ErrorType.AVATAR_ERROR]: 'Avatar update failed. Please try again.',
      [ErrorType.COMPONENT_ERROR]: 'Something went wrong. Please refresh the page.',
      [ErrorType.FORM_ERROR]: 'Form submission failed. Please check your input.',
      [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
    };

    return messages[this.type] || messages[ErrorType.UNKNOWN_ERROR];
  }

  /**
   * Log error with structured data
   */
  logError(): void {
    const logData = {
      type: this.type,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      recoverable: this.recoverable,
      retryable: this.retryable,
      stack: this.stack
    };

    if (this.severity === ErrorSeverity.CRITICAL) {
      console.error('CRITICAL ERROR:', logData);
    } else if (this.severity === ErrorSeverity.HIGH) {
      console.error('HIGH SEVERITY ERROR:', logData);
    } else {
      console.warn('Error:', logData);
    }
  }

  /**
   * Create error from Supabase error
   */
  static fromSupabaseError(error: any, context: ErrorContext = {}): AppError {
    if (error?.code === '23505') {
      return new AppError(
        ErrorType.VALIDATION_ERROR,
        'Duplicate data constraint violation',
        context,
        ErrorSeverity.MEDIUM,
        true,
        false
      );
    }

    if (error?.code === '42501' || error?.message?.includes('permission')) {
      return new AppError(
        ErrorType.PERMISSION_DENIED,
        'Permission denied',
        context,
        ErrorSeverity.HIGH,
        false,
        false
      );
    }

    if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
      return new AppError(
        ErrorType.NETWORK_ERROR,
        'Network connection error',
        context,
        ErrorSeverity.MEDIUM,
        true,
        true
      );
    }

    return new AppError(
      ErrorType.DATABASE_ERROR,
      error?.message || 'Database operation failed',
      context,
      ErrorSeverity.MEDIUM,
      true,
      true
    );
  }

  /**
   * Create error from fetch/API error
   */
  static fromFetchError(error: any, context: ErrorContext = {}): AppError {
    if (error?.name === 'AbortError') {
      return new AppError(
        ErrorType.TIMEOUT_ERROR,
        'Request was cancelled',
        context,
        ErrorSeverity.LOW,
        true,
        true
      );
    }

    if (error?.message?.includes('fetch')) {
      return new AppError(
        ErrorType.NETWORK_ERROR,
        'Network request failed',
        context,
        ErrorSeverity.MEDIUM,
        true,
        true
      );
    }

    return new AppError(
      ErrorType.API_ERROR,
      error?.message || 'API request failed',
      context,
      ErrorSeverity.MEDIUM,
      true,
      true
    );
  }
}

/**
 * Error Manager - Central error handling orchestrator
 */
export class ErrorManager {
  private static recoveryStrategies: RecoveryStrategy[] = [];
  private static retryAttempts = new Map<string, number>();

  /**
   * Register recovery strategy
   */
  static registerRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Handle error with automatic recovery and user notification
   */
  static async handleError(
    error: Error | AppError,
    context: ErrorContext = {},
    showToast: boolean = true
  ): Promise<boolean> {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = new AppError(
        ErrorType.UNKNOWN_ERROR,
        error.message,
        context,
        ErrorSeverity.MEDIUM
      );
    }

    // Log the error
    appError.logError();

    // Show user notification
    if (showToast) {
      this.showErrorToast(appError);
    }

    // Attempt recovery if error is recoverable
    if (appError.recoverable) {
      return await this.attemptRecovery(appError);
    }

    return false;
  }

  /**
   * Attempt error recovery using registered strategies
   */
  private static async attemptRecovery(error: AppError): Promise<boolean> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          console.log(`Attempting recovery: ${strategy.description}`);
          const recovered = await strategy.recover(error);
          
          if (recovered) {
            console.log(`Recovery successful: ${strategy.description}`);
            return true;
          }
        } catch (recoveryError) {
          console.warn(`Recovery failed: ${strategy.description}`, recoveryError);
        }
      }
    }

    return false;
  }

  /**
   * Show appropriate toast notification
   */
  private static showErrorToast(error: AppError): void {
    const toastOptions = {
      duration: this.getToastDuration(error.severity),
      id: `error-${error.type}-${Date.now()}`
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(error.userMessage, { ...toastOptions, duration: 10000 });
        break;
      case ErrorSeverity.HIGH:
        toast.error(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.MEDIUM:
        toast.error(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.LOW:
        toast.warning(error.userMessage, toastOptions);
        break;
    }
  }

  private static getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return 10000;
      case ErrorSeverity.HIGH: return 6000;
      case ErrorSeverity.MEDIUM: return 4000;
      case ErrorSeverity.LOW: return 3000;
      default: return 4000;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Reset retry count on success
        this.retryAttempts.delete(operationId);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
