/**
 * Avatar Transaction Manager
 * Manages avatar upload transactions with rollback capability
 */

import type { AvatarTransaction } from '../types/avatarTypes';

/**
 * Transaction manager for avatar operations
 */
export class AvatarTransactionManager {
  private static activeTransactions = new Map<string, AvatarTransaction>();
  private static readonly TRANSACTION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  /**
   * Start a new avatar transaction
   */
  static startTransaction(userId: string): AvatarTransaction {
    // Clean up any existing transaction for this user
    if (this.activeTransactions.has(userId)) {
      console.warn(`Replacing existing transaction for user: ${userId}`);
      this.activeTransactions.delete(userId);
    }

    const transaction: AvatarTransaction = {
      userId,
      timestamp: Date.now(),
      uploadedFiles: [],
      originalUrls: {},
      newUrls: {},
      completed: false
    };

    this.activeTransactions.set(userId, transaction);
    console.log(`Started avatar transaction for user: ${userId}`);
    
    return transaction;
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
   * Complete a transaction successfully
   */
  static completeTransaction(userId: string): boolean {
    const transaction = this.activeTransactions.get(userId);
    
    if (!transaction) {
      console.warn(`No active transaction found for user: ${userId}`);
      return false;
    }

    transaction.completed = true;
    this.activeTransactions.delete(userId);
    
    console.log(`Completed avatar transaction for user: ${userId}`);
    return true;
  }

  /**
   * Cancel a transaction (without rollback)
   */
  static cancelTransaction(userId: string): boolean {
    const transaction = this.activeTransactions.get(userId);
    
    if (!transaction) {
      console.warn(`No active transaction found for user: ${userId}`);
      return false;
    }

    this.activeTransactions.delete(userId);
    console.log(`Cancelled avatar transaction for user: ${userId}`);
    
    return true;
  }

  /**
   * Update transaction with uploaded file paths
   */
  static addUploadedFiles(userId: string, filePaths: string[]): boolean {
    const transaction = this.activeTransactions.get(userId);
    
    if (!transaction) {
      console.warn(`No active transaction found for user: ${userId}`);
      return false;
    }

    transaction.uploadedFiles.push(...filePaths);
    return true;
  }

  /**
   * Update transaction with original URLs for rollback
   */
  static setOriginalUrls(userId: string, originalUrls: AvatarTransaction['originalUrls']): boolean {
    const transaction = this.activeTransactions.get(userId);
    
    if (!transaction) {
      console.warn(`No active transaction found for user: ${userId}`);
      return false;
    }

    transaction.originalUrls = originalUrls;
    return true;
  }

  /**
   * Update transaction with new URLs
   */
  static setNewUrls(userId: string, newUrls: AvatarTransaction['newUrls']): boolean {
    const transaction = this.activeTransactions.get(userId);
    
    if (!transaction) {
      console.warn(`No active transaction found for user: ${userId}`);
      return false;
    }

    transaction.newUrls = newUrls;
    return true;
  }

  /**
   * Get all active transactions (for monitoring)
   */
  static getAllActiveTransactions(): Map<string, AvatarTransaction> {
    return new Map(this.activeTransactions);
  }

  /**
   * Get transaction count
   */
  static getActiveTransactionCount(): number {
    return this.activeTransactions.size;
  }

  /**
   * Clean up stale transactions (older than timeout)
   */
  static cleanupStaleTransactions(): number {
    const cutoffTime = Date.now() - this.TRANSACTION_TIMEOUT;
    let cleanedCount = 0;
    
    for (const [userId, transaction] of this.activeTransactions.entries()) {
      if (transaction.timestamp < cutoffTime) {
        console.warn(`Cleaning up stale avatar transaction for user: ${userId}`);
        this.activeTransactions.delete(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} stale avatar transactions`);
    }

    return cleanedCount;
  }

  /**
   * Get transaction age in milliseconds
   */
  static getTransactionAge(userId: string): number | null {
    const transaction = this.activeTransactions.get(userId);
    
    if (!transaction) {
      return null;
    }

    return Date.now() - transaction.timestamp;
  }

  /**
   * Check if transaction is stale
   */
  static isTransactionStale(userId: string): boolean {
    const age = this.getTransactionAge(userId);
    
    if (age === null) {
      return false;
    }

    return age > this.TRANSACTION_TIMEOUT;
  }

  /**
   * Force cleanup all transactions (for testing/emergency)
   */
  static forceCleanupAllTransactions(): number {
    const count = this.activeTransactions.size;
    this.activeTransactions.clear();
    
    if (count > 0) {
      console.warn(`Force cleaned up ${count} avatar transactions`);
    }

    return count;
  }
}
