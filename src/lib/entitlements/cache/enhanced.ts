/**
 * Entitlements Cache Enhanced
 *
 * This module provides enhanced cache operations including memory cache and real-time invalidation.
 */

import { 
  CACHE_CONFIG, 
  EntitlementsCache, 
  MemoryCacheEntry, 
  cacheStats, 
  logDebug, 
  getCacheKey, 
  isCacheValid,
  loadFromStorage,
  saveToStorage,
  getCachedUserIds
} from './core';

// In-memory cache for frequently accessed entitlements
const memoryCache = new Map<string, MemoryCacheEntry>();

// Cache invalidation listeners
const invalidationListeners = new Set<(userId: string) => void>();

/**
 * Save cache entry to memory cache
 */
export function saveToMemoryCache(userId: string, cache: EntitlementsCache): void {
  try {
    // Clean up old entries if cache is full
    if (memoryCache.size >= CACHE_CONFIG.MEMORY_CACHE_SIZE) {
      cleanupMemoryCache();
    }

    const entry: MemoryCacheEntry = {
      cache,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    memoryCache.set(userId, entry);
    logDebug('Saved cache to memory', { userId, cacheSize: memoryCache.size });
  } catch (error) {
    console.error('Failed to save entitlements cache to memory:', error);
    cacheStats.errors++;
  }
}

/**
 * Load cache entry from memory cache
 */
export function loadFromMemoryCache(userId: string): EntitlementsCache | null {
  try {
    const entry = memoryCache.get(userId);
    if (!entry) {
      return null;
    }

    // Check if memory cache entry is expired
    const now = Date.now();
    if (now - entry.lastAccessed > CACHE_CONFIG.MEMORY_CACHE_TTL) {
      memoryCache.delete(userId);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    logDebug('Loaded cache from memory', { userId, accessCount: entry.accessCount });
    return entry.cache;
  } catch (error) {
    console.error('Failed to load entitlements cache from memory:', error);
    cacheStats.errors++;
    return null;
  }
}

/**
 * Clean up old entries from memory cache
 */
export function cleanupMemoryCache(): void {
  const entries = Array.from(memoryCache.entries());

  // Sort by last accessed time (oldest first)
  entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

  // Remove oldest 25% of entries
  const toRemove = Math.floor(entries.length * 0.25);
  for (let i = 0; i < toRemove; i++) {
    memoryCache.delete(entries[i][0]);
  }

  logDebug('Cleaned up memory cache', { removed: toRemove, remaining: memoryCache.size });
}

/**
 * Invalidate the entitlements cache for a user
 *
 * @param userId The user ID to invalidate the cache for
 */
export function invalidateUserEntitlements(userId: string): void {
  try {
    // Remove from memory cache
    memoryCache.delete(userId);

    // Remove from storage cache
    const key = getCacheKey(userId);
    sessionStorage.removeItem(key);

    // Notify invalidation listeners
    if (CACHE_CONFIG.REALTIME_ENABLED) {
      invalidationListeners.forEach(listener => {
        try {
          listener(userId);
        } catch (error) {
          console.error('Error in invalidation listener:', error);
        }
      });
    }

    logDebug('Invalidated cache for user', { userId });
  } catch (error) {
    console.error('Failed to invalidate entitlements cache:', error);
    cacheStats.errors++;
  }
}

/**
 * Clear the entire entitlements cache for all users
 */
export function clearEntitlementsCache(): void {
  try {
    // Clear memory cache
    memoryCache.clear();

    // Find all entitlements cache keys in storage
    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // Remove all found keys
    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });

    logDebug('Cleared entire entitlements cache', {
      keysRemoved: keysToRemove.length,
      memoryCacheCleared: true
    });
  } catch (error) {
    console.error('Failed to clear entitlements cache:', error);
    cacheStats.errors++;
  }
}

/**
 * Add a listener for cache invalidation events
 *
 * @param listener Function to call when cache is invalidated
 * @returns Function to remove the listener
 */
export function addCacheInvalidationListener(listener: (userId: string) => void): () => void {
  invalidationListeners.add(listener);
  return () => invalidationListeners.delete(listener);
}

/**
 * Invalidate cache for multiple users
 *
 * @param userIds Array of user IDs to invalidate
 */
export function invalidateMultipleUsers(userIds: string[]): void {
  userIds.forEach(userId => invalidateUserEntitlements(userId));
  logDebug('Invalidated cache for multiple users', { count: userIds.length });
}

/**
 * Get memory cache statistics
 */
export function getMemoryCacheStats() {
  const entries = Array.from(memoryCache.values());
  const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
  const avgAccess = entries.length > 0 ? totalAccess / entries.length : 0;

  return {
    size: memoryCache.size,
    maxSize: CACHE_CONFIG.MEMORY_CACHE_SIZE,
    totalAccess,
    averageAccess: Math.round(avgAccess * 100) / 100,
    oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.lastAccessed)) : null,
    newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.lastAccessed)) : null
  };
}

/**
 * Preload cache for multiple users
 *
 * @param userIds Array of user IDs to preload
 * @param getUserEntitlementsFn Function to get user entitlements
 */
export async function preloadUserEntitlements(
  userIds: string[], 
  getUserEntitlementsFn: (userId: string) => Promise<string[]>
): Promise<void> {
  const promises = userIds.map(userId =>
    getUserEntitlementsFn(userId).catch(error => {
      console.error(`Failed to preload entitlements for user ${userId}:`, error);
    })
  );

  await Promise.all(promises);
  logDebug('Preloaded entitlements for users', { count: userIds.length });
}

/**
 * Clean up expired entries from both memory and storage cache
 */
export function cleanupExpiredCache(): void {
  // Clean memory cache
  const memoryEntries = Array.from(memoryCache.entries());
  let memoryRemoved = 0;

  memoryEntries.forEach(([userId, entry]) => {
    if (!isCacheValid(entry.cache, userId)) {
      memoryCache.delete(userId);
      memoryRemoved++;
    }
  });

  // Clean storage cache
  const cachedUserIds = getCachedUserIds();
  let storageRemoved = 0;

  cachedUserIds.forEach(userId => {
    const cache = loadFromStorage(userId);
    if (!isCacheValid(cache, userId)) {
      const key = getCacheKey(userId);
      sessionStorage.removeItem(key);
      storageRemoved++;
    }
  });

  logDebug('Cleaned up expired cache entries', {
    memoryRemoved,
    storageRemoved,
    memorySize: memoryCache.size
  });
}

/**
 * Clear memory cache only (useful for testing)
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
  logDebug('Cleared memory cache');
}
