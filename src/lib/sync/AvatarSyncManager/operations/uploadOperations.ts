/**
 * Avatar Upload Operations
 * Handles the complete avatar upload workflow with progress tracking
 */

import { AvatarErrorType, type AvatarUrls, type AvatarUploadProgress, type AvatarTransaction } from '../types/avatarTypes';
import { AvatarSyncError } from '../errors/AvatarSyncError';
import { AvatarFileValidator } from '../core/fileValidator';
import { AvatarTransactionManager } from '../core/transactionManager';
import { AvatarUrlUtils } from '../utils/avatarUrlUtils';
import { ProgressMapper } from '../utils/progressMapper';
import { AvatarRollbackOperations } from './rollbackOperations';

/**
 * Upload operations for avatar synchronization
 */
export class AvatarUploadOperations {
  /**
   * Atomic avatar upload with rollback capability
   */
  static async uploadAvatarAtomic(
    file: File,
    userId: string,
    onProgress?: (progress: AvatarUploadProgress) => void
  ): Promise<AvatarUrls> {
    const transaction = AvatarTransactionManager.startTransaction(userId);

    try {
      // Step 1: Validation
      await this.performValidation(file, onProgress);

      // Step 2: Get current URLs for rollback
      const originalUrls = await this.getCurrentUrlsForRollback(userId, transaction);

      // Step 3: Process and upload
      const avatarUrls = await this.processAndUpload(file, userId, transaction, onProgress);

      // Step 4: Enhanced sync validation
      await this.performSyncValidation(userId, onProgress);

      // Step 5: Complete transaction
      this.completeTransaction(userId, avatarUrls, onProgress);

      return avatarUrls;

    } catch (error) {
      // Attempt rollback on failure
      await this.handleUploadFailure(transaction, error);
      throw error;
    }
  }

  /**
   * Perform file validation
   */
  private static async performValidation(
    file: File,
    onProgress?: (progress: AvatarUploadProgress) => void
  ): Promise<void> {
    onProgress?.(ProgressMapper.createProgressUpdate(
      'validation',
      5,
      'Validating image file...'
    ));

    try {
      AvatarFileValidator.validateFile(file);
    } catch (error) {
      if (error instanceof AvatarSyncError) {
        throw error;
      }
      throw new AvatarSyncError(
        AvatarErrorType.INVALID_FILE,
        'File validation failed',
        { originalError: error }
      );
    }
  }

  /**
   * Get current URLs for rollback
   */
  private static async getCurrentUrlsForRollback(
    userId: string,
    transaction: AvatarTransaction
  ): Promise<Partial<AvatarUrls>> {
    const originalUrls = await AvatarUrlUtils.getCurrentAvatarUrls(userId);
    AvatarTransactionManager.setOriginalUrls(userId, originalUrls);
    return originalUrls;
  }

  /**
   * Process and upload avatar using ProfileImageService
   */
  private static async processAndUpload(
    file: File,
    userId: string,
    transaction: AvatarTransaction,
    onProgress?: (progress: AvatarUploadProgress) => void
  ): Promise<AvatarUrls> {
    onProgress?.(ProgressMapper.createProgressUpdate(
      'processing',
      10,
      'Processing image...'
    ));

    try {
      const { ProfileImageService } = await import('@/services/ProfileImageService');
      
      const avatarUrls = await ProfileImageService.uploadAvatar(file, userId, (progress) => {
        // Map ProfileImageService progress to our enhanced progress
        ProgressMapper.mapProfileServiceProgress(progress, onProgress);
      });

      // Store new URLs in transaction
      AvatarTransactionManager.setNewUrls(userId, avatarUrls);

      // Extract and store uploaded file paths for potential rollback
      const uploadedFiles = AvatarUrlUtils.extractFilePathsFromUrls(avatarUrls);
      AvatarTransactionManager.addUploadedFiles(userId, uploadedFiles);

      return avatarUrls;

    } catch (error) {
      console.error('Avatar processing/upload failed:', error);
      
      if (error instanceof AvatarSyncError) {
        throw error;
      }

      throw new AvatarSyncError(
        AvatarErrorType.UPLOAD_FAILED,
        'Failed to process and upload avatar',
        { originalError: error, userId }
      );
    }
  }

  /**
   * Perform enhanced sync validation
   */
  private static async performSyncValidation(
    userId: string,
    onProgress?: (progress: AvatarUploadProgress) => void
  ): Promise<void> {
    onProgress?.(ProgressMapper.createProgressUpdate(
      'syncing',
      90,
      'Validating synchronization...'
    ));

    try {
      // Optional: Perform sync validation if available
      const { validateAndReportSync } = await import('@/lib/sync/ProfileSyncValidator');
      
      // Non-blocking validation
      validateAndReportSync(userId).catch(error => {
        console.warn('Post-avatar-upload sync validation failed:', error);
      });

      console.log('Avatar upload completed successfully for user:', userId);

    } catch (error) {
      // Sync validation is optional - don't fail the upload for this
      console.warn('Could not perform sync validation:', error);
    }
  }

  /**
   * Complete the transaction successfully
   */
  private static completeTransaction(
    userId: string,
    avatarUrls: AvatarUrls,
    onProgress?: (progress: AvatarUploadProgress) => void
  ): void {
    AvatarTransactionManager.completeTransaction(userId);

    onProgress?.(ProgressMapper.createProgressUpdate(
      'complete',
      100,
      'Avatar updated successfully!'
    ));
  }

  /**
   * Handle upload failure with rollback
   */
  private static async handleUploadFailure(
    transaction: AvatarTransaction,
    error: unknown
  ): Promise<void> {
    try {
      await AvatarRollbackOperations.rollbackTransaction(transaction);
    } catch (rollbackError) {
      console.error('Rollback failed after upload failure:', rollbackError);
      // Original error takes precedence
    }

    // Clean up transaction
    AvatarTransactionManager.cancelTransaction(transaction.userId);

    // Ensure we throw an AvatarSyncError
    if (error instanceof AvatarSyncError) {
      return; // Re-throw will happen in caller
    }

    // Wrap unexpected errors
    throw new AvatarSyncError(
      AvatarErrorType.UPLOAD_FAILED,
      'Unexpected error during avatar upload',
      { originalError: error, userId: transaction.userId },
      true
    );
  }

  /**
   * Retry upload operation with exponential backoff
   */
  static async retryUpload(
    file: File,
    userId: string,
    maxRetries: number = 3,
    onProgress?: (progress: AvatarUploadProgress) => void
  ): Promise<AvatarUrls> {
    let lastError: AvatarSyncError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadAvatarAtomic(file, userId, onProgress);
      } catch (error) {
        lastError = AvatarSyncError.fromUnknownError(error);
        
        if (!lastError.retryable || attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(lastError.retryDelay * Math.pow(2, attempt - 1), 10000);
        console.log(`Upload attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new AvatarSyncError(
      AvatarErrorType.UPLOAD_FAILED,
      'Upload failed after all retry attempts'
    );
  }
}
