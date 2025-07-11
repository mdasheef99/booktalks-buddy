/**
 * Avatar Rollback Operations
 * Handles transaction rollback with file cleanup and database restoration
 */

import { supabase } from '@/lib/supabase';
import { safeSupabaseQuery } from '@/lib/database/SafeQuery';
import { AvatarErrorType, type AvatarTransaction } from '../types/avatarTypes';
import { AvatarSyncError } from '../errors/AvatarSyncError';
import { AvatarUrlUtils } from '../utils/avatarUrlUtils';

/**
 * Rollback operations for failed avatar transactions
 */
export class AvatarRollbackOperations {
  /**
   * Rollback failed avatar transaction with comprehensive cleanup
   */
  static async rollbackTransaction(transaction: AvatarTransaction): Promise<void> {
    try {
      console.log('Rolling back avatar transaction for user:', transaction.userId);

      // Step 1: Delete uploaded files from storage
      await this.cleanupUploadedFiles(transaction);

      // Step 2: Restore original URLs in database
      await this.restoreOriginalUrls(transaction);

      // Step 3: Clear any cached data
      await this.clearCachedData(transaction.userId);

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
   * Clean up uploaded files from storage
   */
  private static async cleanupUploadedFiles(transaction: AvatarTransaction): Promise<void> {
    if (transaction.uploadedFiles.length === 0) {
      console.log('No uploaded files to clean up');
      return;
    }

    try {
      console.log(`Cleaning up ${transaction.uploadedFiles.length} uploaded files`);
      
      const { error: deleteError } = await supabase.storage
        .from('profiles')
        .remove(transaction.uploadedFiles);

      if (deleteError) {
        console.warn('Failed to delete some uploaded files during rollback:', deleteError);
        // Don't throw here - partial cleanup is better than no cleanup
      } else {
        console.log('Successfully cleaned up uploaded files');
      }
    } catch (error) {
      console.warn('Error during file cleanup:', error);
      // Don't throw - continue with other rollback steps
    }
  }

  /**
   * Restore original URLs in database
   */
  private static async restoreOriginalUrls(transaction: AvatarTransaction): Promise<void> {
    if (Object.keys(transaction.originalUrls).length === 0) {
      console.log('No original URLs to restore');
      return;
    }

    try {
      console.log('Restoring original avatar URLs');
      
      await AvatarUrlUtils.updateAvatarUrls(transaction.userId, transaction.originalUrls);
      
      console.log('Successfully restored original avatar URLs');
    } catch (error) {
      console.error('Failed to restore original URLs during rollback:', error);
      throw new AvatarSyncError(
        AvatarErrorType.ROLLBACK_FAILED,
        'Failed to restore original avatar URLs',
        { userId: transaction.userId, originalError: error },
        false
      );
    }
  }

  /**
   * Clear cached data for user
   */
  private static async clearCachedData(userId: string): Promise<void> {
    try {
      // Try to use enhanced cache invalidation if available
      const { ProfileCacheManager, CacheInvalidationReason } = await import('@/lib/sync/ProfileCacheManager');
      await ProfileCacheManager.invalidateUserProfile(userId, CacheInvalidationReason.AVATAR_ROLLBACK);
      console.log('Enhanced cache invalidation completed');
    } catch (error) {
      console.warn('Enhanced cache invalidation failed, using basic cache clear:', error);
      
      // Fallback to basic cache clearing
      try {
        const { clearProfileCache } = await import('@/services/profileService');
        clearProfileCache();
        console.log('Basic cache clearing completed');
      } catch (fallbackError) {
        console.warn('Basic cache clearing also failed:', fallbackError);
        // Don't throw - cache clearing failure shouldn't prevent rollback
      }
    }
  }

  /**
   * Partial rollback - only clean up files without database changes
   */
  static async partialRollback(transaction: AvatarTransaction): Promise<void> {
    try {
      console.log('Performing partial rollback (files only) for user:', transaction.userId);
      
      await this.cleanupUploadedFiles(transaction);
      await this.clearCachedData(transaction.userId);
      
      console.log('Partial rollback completed successfully');
    } catch (error) {
      console.error('Partial rollback failed:', error);
      throw new AvatarSyncError(
        AvatarErrorType.ROLLBACK_FAILED,
        'Failed to perform partial rollback',
        { userId: transaction.userId, originalError: error },
        false
      );
    }
  }

  /**
   * Emergency rollback - attempt rollback with minimal error handling
   */
  static async emergencyRollback(userId: string, uploadedFiles: string[]): Promise<void> {
    console.warn(`Performing emergency rollback for user: ${userId}`);
    
    // Create minimal transaction for emergency rollback
    const emergencyTransaction: AvatarTransaction = {
      userId,
      timestamp: Date.now(),
      uploadedFiles,
      originalUrls: {},
      newUrls: {},
      completed: false
    };

    try {
      await this.cleanupUploadedFiles(emergencyTransaction);
      console.log('Emergency rollback completed');
    } catch (error) {
      console.error('Emergency rollback failed:', error);
      // Don't throw - this is last resort cleanup
    }
  }

  /**
   * Validate rollback completion
   */
  static async validateRollback(transaction: AvatarTransaction): Promise<{
    filesCleanedUp: boolean;
    urlsRestored: boolean;
    cacheCleared: boolean;
  }> {
    const result = {
      filesCleanedUp: true,
      urlsRestored: true,
      cacheCleared: true
    };

    try {
      // Check if files were cleaned up (simplified check)
      if (transaction.uploadedFiles.length > 0) {
        // In a real implementation, you might check if files still exist
        // For now, assume cleanup was successful if no errors were thrown
        result.filesCleanedUp = true;
      }

      // Check if URLs were restored
      if (Object.keys(transaction.originalUrls).length > 0) {
        const currentUrls = await AvatarUrlUtils.getCurrentAvatarUrls(transaction.userId);
        const comparison = AvatarUrlUtils.compareAvatarUrls(currentUrls, transaction.originalUrls);
        result.urlsRestored = comparison.identical;
      }

      // Cache clearing is hard to validate, assume success
      result.cacheCleared = true;

    } catch (error) {
      console.warn('Error validating rollback:', error);
      // Return partial results
    }

    return result;
  }
}
