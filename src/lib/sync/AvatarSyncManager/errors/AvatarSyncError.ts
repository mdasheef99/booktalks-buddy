/**
 * Avatar Synchronization Error Handling
 * Enhanced error class with retry logic and user guidance
 */

import { AvatarErrorType, DEFAULT_RETRY_CONFIGS, type RetryConfig } from '../types/avatarTypes';

/**
 * Enhanced error class for avatar synchronization operations
 * Provides retry logic, user guidance, and detailed error context
 */
export class AvatarSyncError extends Error {
  /** The specific avatar error type */
  public readonly avatarErrorType: AvatarErrorType;
  /** Whether this error can be retried */
  public readonly retryable: boolean;
  /** Maximum number of retry attempts */
  public readonly maxRetries: number;
  /** Delay between retries in milliseconds */
  public readonly retryDelay: number;
  /** Additional error context */
  public readonly context: any;
  /** Whether the error is recoverable */
  public readonly recoverable: boolean;

  constructor(
    avatarErrorType: AvatarErrorType,
    message: string,
    context: any = {},
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AvatarSyncError';
    this.avatarErrorType = avatarErrorType;
    this.context = context;
    this.recoverable = recoverable;

    // Set retry properties based on error type
    const retryConfig = this.getRetryConfig(avatarErrorType);
    this.retryable = retryConfig.retryable;
    this.maxRetries = retryConfig.maxRetries;
    this.retryDelay = retryConfig.retryDelay;
  }

  /**
   * Get retry configuration for different error types
   */
  private getRetryConfig(type: AvatarErrorType): RetryConfig {
    return DEFAULT_RETRY_CONFIGS[type] || { retryable: false, maxRetries: 0, retryDelay: 0 };
  }

  /**
   * Get specific retry guidance for users
   */
  getRetryGuidance(): string {
    const guidance = {
      [AvatarErrorType.INVALID_FILE]: 'Try selecting a different image file. JPG, PNG, and WebP formats work best.',
      [AvatarErrorType.FILE_TOO_LARGE]: 'Try compressing your image or choosing a smaller file (under 10MB).',
      [AvatarErrorType.PROCESSING_FAILED]: 'Try a different image format (JPG or PNG work best) or a simpler image.',
      [AvatarErrorType.UPLOAD_FAILED]: 'Check your internet connection and try again. If the problem persists, try a smaller image.',
      [AvatarErrorType.DATABASE_UPDATE_FAILED]: 'Your image was uploaded successfully. Try refreshing the page to see if it appears.',
      [AvatarErrorType.ROLLBACK_FAILED]: 'Please contact support for assistance with this issue.',
      [AvatarErrorType.SYNC_FAILED]: 'Your avatar was updated but may take a moment to appear everywhere. Try refreshing the page.'
    };

    return guidance[this.avatarErrorType] || 'Please try again in a moment.';
  }

  /**
   * Get user-friendly error message for different error types
   */
  static getAvatarErrorMessage(type: AvatarErrorType): string {
    const messages = {
      [AvatarErrorType.INVALID_FILE]: 'Please select a valid image file (JPG, PNG, or WebP).',
      [AvatarErrorType.FILE_TOO_LARGE]: 'Image file is too large. Please choose a file under 10MB.',
      [AvatarErrorType.PROCESSING_FAILED]: 'Failed to process image. Please try a different image.',
      [AvatarErrorType.UPLOAD_FAILED]: 'Failed to upload image. Please check your connection and try again.',
      [AvatarErrorType.DATABASE_UPDATE_FAILED]: 'Image uploaded but failed to update profile. Please refresh and try again.',
      [AvatarErrorType.ROLLBACK_FAILED]: 'Upload failed and cleanup encountered issues. Please contact support.',
      [AvatarErrorType.SYNC_FAILED]: 'Avatar updated but synchronization failed. Changes may not be visible immediately.'
    };

    return messages[type] || 'An unexpected error occurred during avatar upload.';
  }

  /**
   * Create error from unknown error with context
   */
  static fromUnknownError(
    error: unknown,
    defaultType: AvatarErrorType = AvatarErrorType.UPLOAD_FAILED,
    context: any = {}
  ): AvatarSyncError {
    if (error instanceof AvatarSyncError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return new AvatarSyncError(
      defaultType,
      message,
      { originalError: error, ...context },
      true
    );
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof AvatarSyncError) {
      return error.retryable;
    }
    return false;
  }

  /**
   * Get retry delay for error
   */
  static getRetryDelay(error: unknown): number {
    if (error instanceof AvatarSyncError) {
      return error.retryDelay;
    }
    return 0;
  }

  /**
   * Get max retries for error
   */
  static getMaxRetries(error: unknown): number {
    if (error instanceof AvatarSyncError) {
      return error.maxRetries;
    }
    return 0;
  }
}
