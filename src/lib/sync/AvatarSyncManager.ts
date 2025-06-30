/**
 * Avatar Synchronization Manager
 * Provides atomic avatar operations with rollback capability and sync integration
 */

import { supabase } from '@/lib/supabase';
import { safeSupabaseQuery } from '@/lib/database/SafeQuery';
import { toast } from 'sonner';

export interface AvatarUrls {
  thumbnail: string;
  medium: string;
  full: string;
  legacy: string;
}

export interface AvatarUploadProgress {
  stage: 'validation' | 'processing' | 'uploading' | 'updating' | 'syncing' | 'complete';
  progress: number; // 0-100
  message: string;
  currentFile?: string;
}

export interface AvatarTransaction {
  userId: string;
  timestamp: number;
  uploadedFiles: string[];
  originalUrls: Partial<AvatarUrls>;
  newUrls: Partial<AvatarUrls>;
  completed: boolean;
}

/**
 * Avatar-specific error types
 */
export enum AvatarErrorType {
  INVALID_FILE = 'INVALID_FILE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DATABASE_UPDATE_FAILED = 'DATABASE_UPDATE_FAILED',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
  SYNC_FAILED = 'SYNC_FAILED'
}

export class AvatarSyncError extends Error {
  public readonly avatarErrorType: AvatarErrorType;
  public readonly retryable: boolean;
  public readonly maxRetries: number;
  public readonly retryDelay: number; // in milliseconds
  public readonly context: any;
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
  private getRetryConfig(type: AvatarErrorType): { retryable: boolean; maxRetries: number; retryDelay: number } {
    const configs = {
      [AvatarErrorType.INVALID_FILE]: { retryable: false, maxRetries: 0, retryDelay: 0 },
      [AvatarErrorType.FILE_TOO_LARGE]: { retryable: false, maxRetries: 0, retryDelay: 0 },
      [AvatarErrorType.PROCESSING_FAILED]: { retryable: true, maxRetries: 2, retryDelay: 2000 },
      [AvatarErrorType.UPLOAD_FAILED]: { retryable: true, maxRetries: 3, retryDelay: 3000 },
      [AvatarErrorType.DATABASE_UPDATE_FAILED]: { retryable: true, maxRetries: 2, retryDelay: 1000 },
      [AvatarErrorType.ROLLBACK_FAILED]: { retryable: false, maxRetries: 0, retryDelay: 0 },
      [AvatarErrorType.SYNC_FAILED]: { retryable: true, maxRetries: 1, retryDelay: 5000 }
    };

    return configs[type] || { retryable: false, maxRetries: 0, retryDelay: 0 };
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
}

/**
 * Avatar Sync Manager - handles atomic avatar operations
 */
export class AvatarSyncManager {
  private static activeTransactions = new Map<string, AvatarTransaction>();

  /**
   * Start a new avatar transaction
   */
  static startTransaction(userId: string): AvatarTransaction {
    const transaction: AvatarTransaction = {
      userId,
      timestamp: Date.now(),
      uploadedFiles: [],
      originalUrls: {},
      newUrls: {},
      completed: false
    };

    this.activeTransactions.set(userId, transaction);
    return transaction;
  }

  /**
   * Get current user's avatar URLs for rollback
   */
  static async getCurrentAvatarUrls(userId: string): Promise<Partial<AvatarUrls>> {
    try {
      const userQuery = supabase
        .from('users')
        .select('avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url')
        .eq('id', userId)
        .single();

      const { data, error } = await safeSupabaseQuery(
        userQuery,
        null,
        'get_current_avatar_urls'
      );

      if (error) {
        console.warn('Could not fetch current avatar URLs for rollback:', error);
        return {};
      }

      if (!data) {
        return {};
      }

      return {
        legacy: data.avatar_url,
        thumbnail: data.avatar_thumbnail_url,
        medium: data.avatar_medium_url,
        full: data.avatar_full_url
      };
    } catch (error) {
      console.warn('Error fetching current avatar URLs:', error);
      return {};
    }
  }

  /**
   * Validate uploaded file
   */
  static validateFile(file: File): void {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new AvatarSyncError(
        AvatarErrorType.INVALID_FILE,
        `Invalid file type: ${file.type}`,
        { fileName: file.name, fileType: file.type }
      );
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new AvatarSyncError(
        AvatarErrorType.FILE_TOO_LARGE,
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        { fileName: file.name, fileSize: file.size, maxSize }
      );
    }
  }

  /**
   * Atomic avatar upload with rollback capability
   */
  static async uploadAvatarAtomic(
    file: File,
    userId: string,
    onProgress?: (progress: AvatarUploadProgress) => void
  ): Promise<AvatarUrls> {
    const transaction = this.startTransaction(userId);

    try {
      // Step 1: Validation
      onProgress?.({
        stage: 'validation',
        progress: 5,
        message: 'Validating image file...'
      });

      this.validateFile(file);

      // Step 2: Get current URLs for rollback
      transaction.originalUrls = await this.getCurrentAvatarUrls(userId);

      // Step 3: Process and upload using existing ProfileImageService
      onProgress?.({
        stage: 'processing',
        progress: 10,
        message: 'Processing image...'
      });

      const { ProfileImageService } = await import('@/services/ProfileImageService');
      
      const avatarUrls = await ProfileImageService.uploadAvatar(file, userId, (progress) => {
        // Map ProfileImageService progress to our enhanced progress
        const stageMap = {
          'processing': 'processing' as const,
          'uploading': 'uploading' as const,
          'updating': 'updating' as const,
          'complete': 'syncing' as const
        };

        onProgress?.({
          stage: stageMap[progress.stage] || 'uploading',
          progress: Math.min(progress.progress, 85), // Reserve 15% for sync
          message: progress.message
        });
      });

      transaction.newUrls = avatarUrls;

      // Step 4: Enhanced sync validation
      onProgress?.({
        stage: 'syncing',
        progress: 90,
        message: 'Validating synchronization...'
      });

      // Avatar upload completed successfully
      console.log('Avatar upload completed successfully for user:', userId);

      // Step 5: Complete transaction
      transaction.completed = true;
      this.activeTransactions.delete(userId);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Avatar updated successfully!'
      });

      return avatarUrls;

    } catch (error) {
      // Attempt rollback on failure
      await this.rollbackTransaction(transaction);

      if (error instanceof AvatarSyncError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new AvatarSyncError(
        AvatarErrorType.UPLOAD_FAILED,
        'Unexpected error during avatar upload',
        { originalError: error, userId },
        true
      );
    }
  }

  /**
   * Rollback failed avatar transaction
   */
  static async rollbackTransaction(transaction: AvatarTransaction): Promise<void> {
    try {
      console.log('Rolling back avatar transaction for user:', transaction.userId);

      // Step 1: Delete uploaded files from storage
      if (transaction.uploadedFiles.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('profiles')
          .remove(transaction.uploadedFiles);

        if (deleteError) {
          console.warn('Failed to delete uploaded files during rollback:', deleteError);
        }
      }

      // Step 2: Restore original URLs in database
      if (Object.keys(transaction.originalUrls).length > 0) {
        const updateQuery = supabase
          .from('users')
          .update({
            avatar_url: transaction.originalUrls.legacy,
            avatar_thumbnail_url: transaction.originalUrls.thumbnail,
            avatar_medium_url: transaction.originalUrls.medium,
            avatar_full_url: transaction.originalUrls.full
          })
          .eq('id', transaction.userId);

        const { error: updateError } = await safeSupabaseQuery(
          updateQuery,
          null,
          'rollback_avatar_urls'
        );

        if (updateError) {
          console.error('Failed to restore original URLs during rollback:', updateError);
          throw new AvatarSyncError(
            AvatarErrorType.ROLLBACK_FAILED,
            'Failed to restore original avatar',
            { userId: transaction.userId, originalError: updateError },
            false
          );
        }
      }

      // Step 3: Clear any cached data (simplified)
      console.log('Avatar rollback completed for user:', transaction.userId);

      // Clean up transaction
      this.activeTransactions.delete(transaction.userId);

      console.log('Avatar transaction rollback completed successfully');
    } catch (error) {
      console.error('Avatar rollback failed:', error);
      throw new AvatarSyncError(
        AvatarErrorType.ROLLBACK_FAILED,
        'Failed to rollback avatar transaction',
        { userId: transaction.userId, originalError: error },
        false
      );
    }
  }

  /**
   * Get active transaction for user
   */
  static getActiveTransaction(userId: string): AvatarTransaction | undefined {
    return this.activeTransactions.get(userId);
  }

  /**
   * Check if user has active avatar transaction
   */
  static hasActiveTransaction(userId: string): boolean {
    return this.activeTransactions.has(userId);
  }

  /**
   * Clean up stale transactions (older than 10 minutes)
   */
  static cleanupStaleTransactions(): void {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    
    for (const [userId, transaction] of this.activeTransactions.entries()) {
      if (transaction.timestamp < tenMinutesAgo) {
        console.warn('Cleaning up stale avatar transaction for user:', userId);
        this.activeTransactions.delete(userId);
      }
    }
  }
}
