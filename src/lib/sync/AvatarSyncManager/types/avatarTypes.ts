/**
 * Avatar Synchronization Types
 * Centralized type definitions for avatar operations
 */

/**
 * Avatar URLs for different image sizes
 */
export interface AvatarUrls {
  /** Thumbnail size (100x100) */
  thumbnail: string;
  /** Medium size (300x300) */
  medium: string;
  /** Full size (600x600) */
  full: string;
  /** Legacy URL for backward compatibility */
  legacy: string;
}

/**
 * Progress tracking for avatar upload operations
 */
export interface AvatarUploadProgress {
  /** Current stage of the upload process */
  stage: 'validation' | 'processing' | 'uploading' | 'updating' | 'syncing' | 'complete';
  /** Progress percentage (0-100) */
  progress: number;
  /** Human-readable progress message */
  message: string;
  /** Optional current file being processed */
  currentFile?: string;
}

/**
 * Avatar transaction for atomic operations with rollback capability
 */
export interface AvatarTransaction {
  /** User ID for this transaction */
  userId: string;
  /** Transaction timestamp */
  timestamp: number;
  /** List of uploaded file paths for cleanup */
  uploadedFiles: string[];
  /** Original avatar URLs for rollback */
  originalUrls: Partial<AvatarUrls>;
  /** New avatar URLs after upload */
  newUrls: Partial<AvatarUrls>;
  /** Whether the transaction completed successfully */
  completed: boolean;
}

/**
 * Avatar-specific error types for enhanced error handling
 */
export enum AvatarErrorType {
  /** Invalid file format or corrupted file */
  INVALID_FILE = 'INVALID_FILE',
  /** File size exceeds maximum allowed */
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  /** Image processing failed */
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  /** Upload to storage failed */
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  /** Database update failed */
  DATABASE_UPDATE_FAILED = 'DATABASE_UPDATE_FAILED',
  /** Transaction rollback failed */
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
  /** Synchronization validation failed */
  SYNC_FAILED = 'SYNC_FAILED'
}

/**
 * Retry configuration for different error types
 */
export interface RetryConfig {
  /** Whether this error type is retryable */
  retryable: boolean;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
}

/**
 * File validation configuration
 */
export interface FileValidationConfig {
  /** Allowed MIME types */
  validTypes: string[];
  /** Maximum file size in bytes */
  maxSize: number;
}

/**
 * Default file validation configuration
 */
export const DEFAULT_FILE_VALIDATION: FileValidationConfig = {
  validTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: 10 * 1024 * 1024 // 10MB
};

/**
 * Default retry configurations for different error types
 */
export const DEFAULT_RETRY_CONFIGS: Record<AvatarErrorType, RetryConfig> = {
  [AvatarErrorType.INVALID_FILE]: { retryable: false, maxRetries: 0, retryDelay: 0 },
  [AvatarErrorType.FILE_TOO_LARGE]: { retryable: false, maxRetries: 0, retryDelay: 0 },
  [AvatarErrorType.PROCESSING_FAILED]: { retryable: true, maxRetries: 2, retryDelay: 2000 },
  [AvatarErrorType.UPLOAD_FAILED]: { retryable: true, maxRetries: 3, retryDelay: 3000 },
  [AvatarErrorType.DATABASE_UPDATE_FAILED]: { retryable: true, maxRetries: 2, retryDelay: 1000 },
  [AvatarErrorType.ROLLBACK_FAILED]: { retryable: false, maxRetries: 0, retryDelay: 0 },
  [AvatarErrorType.SYNC_FAILED]: { retryable: true, maxRetries: 1, retryDelay: 5000 }
};
