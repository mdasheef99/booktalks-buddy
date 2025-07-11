/**
 * Avatar Sync Manager - Main Class
 * Provides atomic avatar operations with rollback capability and sync integration
 */

import type { AvatarUrls, AvatarUploadProgress, AvatarTransaction } from '../types/avatarTypes';
import { AvatarTransactionManager } from './transactionManager';
import { AvatarFileValidator } from './fileValidator';
import { AvatarUploadOperations } from '../operations/uploadOperations';
import { AvatarRollbackOperations } from '../operations/rollbackOperations';
import { AvatarUrlUtils } from '../utils/avatarUrlUtils';

/**
 * Avatar Sync Manager - handles atomic avatar operations
 */
export class AvatarSyncManager {
  /**
   * Atomic avatar upload with rollback capability
   * Main public API for avatar uploads
   */
  static async uploadAvatarAtomic(
    file: File,
    userId: string,
    onProgress?: (progress: AvatarUploadProgress) => void
  ): Promise<AvatarUrls> {
    return AvatarUploadOperations.uploadAvatarAtomic(file, userId, onProgress);
  }

  /**
   * Retry avatar upload with exponential backoff
   */
  static async retryUploadAtomic(
    file: File,
    userId: string,
    maxRetries: number = 3,
    onProgress?: (progress: AvatarUploadProgress) => void
  ): Promise<AvatarUrls> {
    return AvatarUploadOperations.retryUpload(file, userId, maxRetries, onProgress);
  }

  /**
   * Validate uploaded file
   */
  static validateFile(file: File): void {
    return AvatarFileValidator.validateFile(file);
  }

  /**
   * Get file validation summary
   */
  static getFileValidationSummary(file: File): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    return AvatarFileValidator.getValidationSummary(file);
  }

  /**
   * Start a new avatar transaction
   */
  static startTransaction(userId: string): AvatarTransaction {
    return AvatarTransactionManager.startTransaction(userId);
  }

  /**
   * Get active transaction for user
   */
  static getActiveTransaction(userId: string): AvatarTransaction | undefined {
    return AvatarTransactionManager.getActiveTransaction(userId);
  }

  /**
   * Check if user has active avatar transaction
   */
  static hasActiveTransaction(userId: string): boolean {
    return AvatarTransactionManager.hasActiveTransaction(userId);
  }

  /**
   * Get current user's avatar URLs for rollback
   */
  static async getCurrentAvatarUrls(userId: string): Promise<Partial<AvatarUrls>> {
    return AvatarUrlUtils.getCurrentAvatarUrls(userId);
  }

  /**
   * Update user's avatar URLs in database
   */
  static async updateAvatarUrls(userId: string, avatarUrls: Partial<AvatarUrls>): Promise<void> {
    return AvatarUrlUtils.updateAvatarUrls(userId, avatarUrls);
  }

  /**
   * Rollback failed avatar transaction
   */
  static async rollbackTransaction(transaction: AvatarTransaction): Promise<void> {
    return AvatarRollbackOperations.rollbackTransaction(transaction);
  }

  /**
   * Perform partial rollback (files only)
   */
  static async partialRollback(transaction: AvatarTransaction): Promise<void> {
    return AvatarRollbackOperations.partialRollback(transaction);
  }

  /**
   * Emergency rollback for cleanup
   */
  static async emergencyRollback(userId: string, uploadedFiles: string[]): Promise<void> {
    return AvatarRollbackOperations.emergencyRollback(userId, uploadedFiles);
  }

  /**
   * Clean up stale transactions (older than 10 minutes)
   */
  static cleanupStaleTransactions(): number {
    return AvatarTransactionManager.cleanupStaleTransactions();
  }

  /**
   * Get all active transactions (for monitoring)
   */
  static getAllActiveTransactions(): Map<string, AvatarTransaction> {
    return AvatarTransactionManager.getAllActiveTransactions();
  }

  /**
   * Get active transaction count
   */
  static getActiveTransactionCount(): number {
    return AvatarTransactionManager.getActiveTransactionCount();
  }

  /**
   * Get preferred avatar URL by size
   */
  static getPreferredAvatarUrl(
    avatarUrls: Partial<AvatarUrls>, 
    preferredSize: 'thumbnail' | 'medium' | 'full' = 'medium'
  ): string | null {
    return AvatarUrlUtils.getPreferredAvatarUrl(avatarUrls, preferredSize);
  }

  /**
   * Validate avatar URLs
   */
  static validateAvatarUrls(avatarUrls: Partial<AvatarUrls>): boolean {
    return AvatarUrlUtils.validateAvatarUrls(avatarUrls);
  }

  /**
   * Compare two avatar URL sets
   */
  static compareAvatarUrls(
    urls1: Partial<AvatarUrls>, 
    urls2: Partial<AvatarUrls>
  ): {
    identical: boolean;
    differences: Array<{
      field: keyof AvatarUrls;
      value1: string | undefined;
      value2: string | undefined;
    }>;
  } {
    return AvatarUrlUtils.compareAvatarUrls(urls1, urls2);
  }

  /**
   * Force cleanup all transactions (for testing/emergency)
   */
  static forceCleanupAllTransactions(): number {
    return AvatarTransactionManager.forceCleanupAllTransactions();
  }

  /**
   * Get transaction age in milliseconds
   */
  static getTransactionAge(userId: string): number | null {
    return AvatarTransactionManager.getTransactionAge(userId);
  }

  /**
   * Check if transaction is stale
   */
  static isTransactionStale(userId: string): boolean {
    return AvatarTransactionManager.isTransactionStale(userId);
  }
}
