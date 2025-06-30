/**
 * Profile Synchronization System - Main Export
 * Provides a unified interface for all profile sync operations
 */

// Error handling
export {
  ProfileSyncError,
  SyncErrorType,
  attemptErrorRecovery,
  type SyncErrorContext,
  type RecoveryStrategy
} from './ProfileSyncError';

// Validation
export {
  validateProfileSync,
  validateAndReportSync,
  forceSyncRecovery,
  type SyncValidationResult,
  type SyncInconsistency,
  type AuthMetadata,
  type DatabaseProfile
} from './ProfileSyncValidator';

// Cache management
export {
  ProfileCacheManager,
  CacheInvalidationReason
} from './ProfileCacheManager';

// Monitoring
export {
  ProfileSyncMonitor,
  type SyncMetrics,
  type SyncHealthReport
} from './ProfileSyncMonitor';

// Avatar management
export {
  AvatarSyncManager,
  AvatarSyncError,
  type AvatarUrls,
  type AvatarUploadProgress,
  type AvatarTransaction
} from './AvatarSyncManager';

/**
 * Convenience functions for common sync operations
 */

/**
 * Perform a complete profile sync with validation and monitoring
 */
export async function performCompleteProfileSync(userId: string): Promise<{
  success: boolean;
  error?: ProfileSyncError;
  validationResult?: SyncValidationResult;
}> {
  const { ProfileSyncError, SyncErrorType } = await import('./ProfileSyncError');
  const { validateProfileSync } = await import('./ProfileSyncValidator');
  const { ProfileSyncMonitor } = await import('./ProfileSyncMonitor');
  const { syncUserProfileToDatabase } = await import('../syncUserProfile');

  try {
    // Step 1: Perform sync
    const syncSuccess = await syncUserProfileToDatabase(userId);
    
    if (!syncSuccess) {
      const error = new ProfileSyncError(
        SyncErrorType.PARTIAL_SYNC_FAILURE,
        'Profile sync failed',
        { userId, operation: 'complete_sync' },
        true
      );
      ProfileSyncMonitor.recordFailure(error, false);
      return { success: false, error };
    }

    // Step 2: Validate sync
    const validationResult = await validateProfileSync(userId);
    
    if (validationResult.valid || validationResult.recovered) {
      ProfileSyncMonitor.recordSuccess(validationResult.validationTime);
      return { success: true, validationResult };
    } else {
      const error = new ProfileSyncError(
        SyncErrorType.SYNC_VALIDATION_FAILED,
        'Sync validation failed',
        { userId, operation: 'complete_sync' },
        true
      );
      ProfileSyncMonitor.recordFailure(error, validationResult.recovered);
      return { success: false, error, validationResult };
    }
  } catch (error) {
    const syncError = new ProfileSyncError(
      SyncErrorType.PARTIAL_SYNC_FAILURE,
      'Unexpected error during complete sync',
      { userId, operation: 'complete_sync', originalError: error as Error },
      true
    );
    ProfileSyncMonitor.recordFailure(syncError, false);
    return { success: false, error: syncError };
  }
}

/**
 * Get sync system health status
 */
export async function getSyncSystemHealth(): Promise<SyncHealthReport> {
  const { ProfileSyncMonitor } = await import('./ProfileSyncMonitor');
  return await ProfileSyncMonitor.generateHealthReport();
}

/**
 * Emergency sync system reset (for development/debugging)
 */
export async function emergencySyncReset(): Promise<void> {
  console.warn('Performing emergency sync system reset...');
  
  try {
    const { ProfileSyncMonitor } = await import('./ProfileSyncMonitor');
    const { ProfileCacheManager } = await import('./ProfileCacheManager');
    
    // Reset monitoring
    ProfileSyncMonitor.resetMetrics();
    
    // Clear all caches
    await ProfileCacheManager.clearAllCaches();
    
    console.log('Emergency sync reset completed successfully');
  } catch (error) {
    console.error('Emergency sync reset failed:', error);
    throw error;
  }
}

/**
 * Validate sync for all users (admin function)
 */
export async function validateAllUsersSyncStatus(userIds: string[]): Promise<{
  results: Map<string, SyncValidationResult>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    recovered: number;
  };
}> {
  const { ProfileSyncMonitor } = await import('./ProfileSyncMonitor');
  return await ProfileSyncMonitor.validateMultipleUsers(userIds);
}

/**
 * Development utilities
 */
export const DevUtils = {
  /**
   * Simulate sync error for testing
   */
  async simulateError(type: SyncErrorType, userId: string): Promise<ProfileSyncError> {
    const { ProfileSyncError } = await import('./ProfileSyncError');
    const { ProfileSyncMonitor } = await import('./ProfileSyncMonitor');
    
    const error = new ProfileSyncError(
      type,
      `Simulated error: ${type}`,
      { userId, operation: 'simulation' },
      true
    );
    
    ProfileSyncMonitor.recordFailure(error, false);
    return error;
  },

  /**
   * Get detailed cache information
   */
  async getCacheDetails(): Promise<any> {
    const { ProfileCacheManager } = await import('./ProfileCacheManager');
    return await ProfileCacheManager.getCacheStats();
  },

  /**
   * Force cache invalidation for testing
   */
  async forceCacheInvalidation(userId: string): Promise<void> {
    const { ProfileCacheManager, CacheInvalidationReason } = await import('./ProfileCacheManager');
    await ProfileCacheManager.invalidateUserProfile(userId, CacheInvalidationReason.MANUAL_REFRESH);
  }
};

/**
 * Quick health check function
 */
export async function quickHealthCheck(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: any;
}> {
  try {
    const health = await getSyncSystemHealth();
    
    return {
      status: health.overallHealth,
      message: health.recommendations[0] || 'System is healthy',
      details: {
        successRate: health.metrics.totalOperations > 0 
          ? (health.metrics.successfulOperations / health.metrics.totalOperations * 100).toFixed(1) + '%'
          : 'N/A',
        totalOperations: health.metrics.totalOperations,
        recentErrors: health.recentErrors.length,
        cacheSize: health.cacheStats.profileCacheSize
      }
    };
  } catch (error) {
    return {
      status: 'critical',
      message: 'Health check failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}
