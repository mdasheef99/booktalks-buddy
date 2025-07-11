/**
 * Avatar Sync Manager - Main Export
 * Maintains 100% backward compatibility with the original AvatarSyncManager.ts
 */

// Type definitions
export type {
  AvatarUrls,
  AvatarUploadProgress,
  AvatarTransaction,
  RetryConfig,
  FileValidationConfig
} from './types/avatarTypes';

export {
  AvatarErrorType,
  DEFAULT_FILE_VALIDATION,
  DEFAULT_RETRY_CONFIGS
} from './types/avatarTypes';

// Error handling
export { AvatarSyncError } from './errors/AvatarSyncError';

// Main manager class
export { AvatarSyncManager } from './core/AvatarSyncManager';

// Utility classes (for advanced usage)
export { AvatarFileValidator } from './core/fileValidator';
export { AvatarTransactionManager } from './core/transactionManager';
export { AvatarUrlUtils } from './utils/avatarUrlUtils';
export { ProgressMapper } from './utils/progressMapper';

// Operation classes (for advanced usage)
export { AvatarUploadOperations } from './operations/uploadOperations';
export { AvatarRollbackOperations } from './operations/rollbackOperations';

/**
 * Convenience functions for common operations
 */

/**
 * Quick avatar upload with default settings
 */
export async function uploadAvatar(
  file: File,
  userId: string,
  onProgress?: (progress: AvatarUploadProgress) => void
): Promise<AvatarUrls> {
  return AvatarSyncManager.uploadAvatarAtomic(file, userId, onProgress);
}

/**
 * Quick file validation
 */
export function validateAvatarFile(file: File): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  return AvatarFileValidator.getValidationSummary(file);
}

/**
 * Quick avatar URL validation
 */
export function validateAvatarUrls(avatarUrls: Partial<AvatarUrls>): boolean {
  return AvatarUrlUtils.validateAvatarUrls(avatarUrls);
}

/**
 * Get preferred avatar URL
 */
export function getPreferredAvatarUrl(
  avatarUrls: Partial<AvatarUrls>,
  preferredSize: 'thumbnail' | 'medium' | 'full' = 'medium'
): string | null {
  return AvatarUrlUtils.getPreferredAvatarUrl(avatarUrls, preferredSize);
}

/**
 * Clean up stale transactions
 */
export function cleanupStaleAvatarTransactions(): number {
  return AvatarTransactionManager.cleanupStaleTransactions();
}

/**
 * Emergency cleanup all transactions
 */
export function emergencyCleanupAllTransactions(): number {
  return AvatarTransactionManager.forceCleanupAllTransactions();
}

// Note: Default export removed to avoid circular reference issues
// All exports are available as named exports for better tree-shaking
