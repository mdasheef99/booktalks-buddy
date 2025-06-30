/**
 * Enhanced Profile Cache Management
 * Provides intelligent cache invalidation and coordination across components
 */

import { ProfileSyncError, SyncErrorType } from './ProfileSyncError';

// Cache invalidation event system
type CacheInvalidationListener = (userId: string, reason: string) => void;
const cacheInvalidationListeners: CacheInvalidationListener[] = [];

/**
 * Cache invalidation reasons for monitoring
 */
export enum CacheInvalidationReason {
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  AVATAR_UPLOAD = 'AVATAR_UPLOAD',
  SYNC_RECOVERY = 'SYNC_RECOVERY',
  MANUAL_REFRESH = 'MANUAL_REFRESH',
  ERROR_RECOVERY = 'ERROR_RECOVERY',
  AUTH_CHANGE = 'AUTH_CHANGE'
}

/**
 * Enhanced Profile Cache Manager
 */
export class ProfileCacheManager {
  /**
   * Invalidate user profile cache with comprehensive cleanup
   */
  static async invalidateUserProfile(
    userId: string, 
    reason: CacheInvalidationReason = CacheInvalidationReason.PROFILE_UPDATE
  ): Promise<void> {
    try {
      console.log(`Invalidating profile cache for user ${userId}, reason: ${reason}`);

      // Clear profile service cache
      await this.clearProfileServiceCache(userId);

      // Clear username resolution cache
      await this.clearUsernameCache(userId);

      // Clear any component-level caches
      await this.clearComponentCaches(userId);

      // Notify listeners of cache invalidation
      this.emitCacheInvalidation(userId, reason);

      console.log(`Profile cache invalidated successfully for user ${userId}`);
    } catch (error) {
      console.error('Cache invalidation failed:', error);
      throw new ProfileSyncError(
        SyncErrorType.CACHE_INVALIDATION_FAILED,
        'Failed to invalidate profile cache',
        { userId, operation: 'cache_invalidation', originalError: error as Error },
        true
      );
    }
  }

  /**
   * Clear profile service cache
   */
  private static async clearProfileServiceCache(userId: string): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const { clearProfileCache } = await import('@/services/profileService');
      
      // Clear the specific user from cache
      const profileService = await import('@/services/profileService');
      if (profileService.profileCache && profileService.profileCache[userId]) {
        delete profileService.profileCache[userId];
      }
      
      // If clearProfileCache is available, use it for comprehensive cleanup
      if (typeof clearProfileCache === 'function') {
        clearProfileCache();
      }
    } catch (error) {
      console.warn('Failed to clear profile service cache:', error);
      // Don't throw - partial cache clearing is acceptable
    }
  }

  /**
   * Clear username resolution cache
   */
  private static async clearUsernameCache(userId: string): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const usernameResolution = await import('@/lib/usernameResolution');
      
      // Clear username cache if available
      if (usernameResolution.usernameCache) {
        // Find and remove entries for this user
        for (const [cachedUserId, username] of usernameResolution.usernameCache.entries()) {
          if (cachedUserId === userId) {
            usernameResolution.usernameCache.delete(cachedUserId);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear username cache:', error);
      // Don't throw - partial cache clearing is acceptable
    }
  }

  /**
   * Clear component-level caches
   */
  private static async clearComponentCaches(userId: string): Promise<void> {
    try {
      // Clear any React Query caches if available
      if (typeof window !== 'undefined' && (window as any).queryClient) {
        const queryClient = (window as any).queryClient;
        
        // Invalidate profile-related queries
        await queryClient.invalidateQueries(['profile', userId]);
        await queryClient.invalidateQueries(['user', userId]);
        await queryClient.invalidateQueries(['avatar', userId]);
      }
    } catch (error) {
      console.warn('Failed to clear component caches:', error);
      // Don't throw - partial cache clearing is acceptable
    }
  }

  /**
   * Emit cache invalidation event to listeners
   */
  private static emitCacheInvalidation(userId: string, reason: CacheInvalidationReason): void {
    const reasonString = reason.toString();
    
    cacheInvalidationListeners.forEach(listener => {
      try {
        listener(userId, reasonString);
      } catch (error) {
        console.warn('Cache invalidation listener failed:', error);
      }
    });
  }

  /**
   * Add cache invalidation listener
   */
  static addCacheInvalidationListener(listener: CacheInvalidationListener): () => void {
    cacheInvalidationListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = cacheInvalidationListeners.indexOf(listener);
      if (index > -1) {
        cacheInvalidationListeners.splice(index, 1);
      }
    };
  }

  /**
   * Preload user profile into cache
   */
  static async preloadUserProfile(userId: string): Promise<void> {
    try {
      const { getUserProfile } = await import('@/services/profileService');
      await getUserProfile(userId);
      console.log(`Profile preloaded for user ${userId}`);
    } catch (error) {
      console.warn('Failed to preload profile:', error);
      // Don't throw - preloading is optional
    }
  }

  /**
   * Warm cache for multiple users
   */
  static async warmCache(userIds: string[]): Promise<void> {
    try {
      const { getUserProfiles } = await import('@/services/profileService');
      await getUserProfiles(userIds);
      console.log(`Cache warmed for ${userIds.length} users`);
    } catch (error) {
      console.warn('Failed to warm cache:', error);
      // Don't throw - cache warming is optional
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getCacheStats(): Promise<{
    profileCacheSize: number;
    usernameCacheSize: number;
    lastInvalidation?: Date;
  }> {
    try {
      let profileCacheSize = 0;
      let usernameCacheSize = 0;

      // Get profile cache size
      try {
        const profileService = await import('@/services/profileService');
        if (profileService.profileCache) {
          profileCacheSize = Object.keys(profileService.profileCache).length;
        }
      } catch (error) {
        console.warn('Failed to get profile cache size:', error);
      }

      // Get username cache size
      try {
        const usernameResolution = await import('@/lib/usernameResolution');
        if (usernameResolution.usernameCache) {
          usernameCacheSize = usernameResolution.usernameCache.size;
        }
      } catch (error) {
        console.warn('Failed to get username cache size:', error);
      }

      return {
        profileCacheSize,
        usernameCacheSize
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        profileCacheSize: 0,
        usernameCacheSize: 0
      };
    }
  }

  /**
   * Clear all caches (emergency cleanup)
   */
  static async clearAllCaches(): Promise<void> {
    try {
      console.log('Clearing all profile caches...');

      // Clear profile service cache
      try {
        const { clearProfileCache } = await import('@/services/profileService');
        if (typeof clearProfileCache === 'function') {
          clearProfileCache();
        }
      } catch (error) {
        console.warn('Failed to clear profile service cache:', error);
      }

      // Clear username resolution cache
      try {
        const usernameResolution = await import('@/lib/usernameResolution');
        if (usernameResolution.usernameCache) {
          usernameResolution.usernameCache.clear();
        }
      } catch (error) {
        console.warn('Failed to clear username cache:', error);
      }

      // Clear React Query caches
      try {
        if (typeof window !== 'undefined' && (window as any).queryClient) {
          const queryClient = (window as any).queryClient;
          await queryClient.clear();
        }
      } catch (error) {
        console.warn('Failed to clear React Query cache:', error);
      }

      console.log('All profile caches cleared successfully');
    } catch (error) {
      console.error('Failed to clear all caches:', error);
      throw new ProfileSyncError(
        SyncErrorType.CACHE_INVALIDATION_FAILED,
        'Failed to clear all caches',
        { operation: 'clear_all_caches', originalError: error as Error },
        true
      );
    }
  }
}
