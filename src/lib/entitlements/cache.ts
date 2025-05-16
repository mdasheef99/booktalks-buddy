/**
 * Entitlements Caching
 *
 * This module provides functions for caching and retrieving user entitlements.
 * It uses sessionStorage for persistence across page refreshes and includes
 * versioning and expiration for better cache management.
 */

import { calculateUserEntitlements } from './index';

// Cache configuration
const CACHE_CONFIG = {
  // Cache expiration time in milliseconds (5 minutes by default)
  EXPIRATION: 5 * 60 * 1000,
  // Storage key prefix for sessionStorage
  KEY_PREFIX: 'entitlements_cache_',
  // Current cache version - increment when cache structure changes
  VERSION: 1,
  // Enable debug logging
  DEBUG: false
};

// Typed cache structure with versioning and expiration
interface EntitlementsCache {
  entitlements: string[];
  version: number;
  timestamp: number;
  userId: string;
}

// Cache statistics for monitoring
interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
}

// Initialize cache statistics
const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  errors: 0
};

/**
 * Helper function to log debug messages
 */
function logDebug(message: string, ...args: any[]): void {
  if (CACHE_CONFIG.DEBUG) {
    console.debug(`[EntitlementsCache] ${message}`, ...args);
  }
}

/**
 * Get the cache key for a user
 */
function getCacheKey(userId: string): string {
  return `${CACHE_CONFIG.KEY_PREFIX}${userId}`;
}

/**
 * Save cache entry to sessionStorage
 */
function saveToStorage(userId: string, cache: EntitlementsCache): void {
  try {
    const key = getCacheKey(userId);
    sessionStorage.setItem(key, JSON.stringify(cache));
    logDebug('Saved cache to sessionStorage', { userId, cache });
  } catch (error) {
    console.error('Failed to save entitlements cache to sessionStorage:', error);
    cacheStats.errors++;
  }
}

/**
 * Load cache entry from sessionStorage
 */
function loadFromStorage(userId: string): EntitlementsCache | null {
  try {
    const key = getCacheKey(userId);
    const data = sessionStorage.getItem(key);

    if (!data) {
      return null;
    }

    const cache = JSON.parse(data) as EntitlementsCache;
    logDebug('Loaded cache from sessionStorage', { userId, cache });
    return cache;
  } catch (error) {
    console.error('Failed to load entitlements cache from sessionStorage:', error);
    cacheStats.errors++;
    return null;
  }
}

/**
 * Check if a cache entry is valid and not expired
 */
function isCacheValid(cache: EntitlementsCache | null, userId: string): boolean {
  if (!cache) {
    return false;
  }

  const now = Date.now();
  const isExpired = now - cache.timestamp >= CACHE_CONFIG.EXPIRATION;
  const isVersionMatch = cache.version === CACHE_CONFIG.VERSION;
  const isUserMatch = cache.userId === userId;

  return !isExpired && isVersionMatch && isUserMatch;
}

/**
 * Get entitlements for a user, using cache if available and not expired
 *
 * @param userId The user ID to get entitlements for
 * @param forceRefresh Whether to force a refresh of the cache
 * @returns A promise that resolves to an array of entitlement strings
 */
export async function getUserEntitlements(
  userId: string,
  forceRefresh = false
): Promise<string[]> {
  if (!userId) {
    logDebug('No userId provided, returning empty entitlements');
    return [];
  }

  // Try to load from sessionStorage if not forcing refresh
  if (!forceRefresh) {
    const cache = loadFromStorage(userId);

    if (isCacheValid(cache, userId)) {
      cacheStats.hits++;
      logDebug('Cache hit', { userId, stats: cacheStats });
      return cache.entitlements;
    }

    cacheStats.misses++;
    logDebug('Cache miss or expired', { userId, stats: cacheStats });
  } else {
    logDebug('Force refresh requested', { userId });
  }

  // Calculate fresh entitlements
  try {
    const entitlements = await calculateUserEntitlements(userId);

    // Create new cache entry
    const cacheEntry: EntitlementsCache = {
      entitlements,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now(),
      userId
    };

    // Save to sessionStorage
    saveToStorage(userId, cacheEntry);

    return entitlements;
  } catch (error) {
    console.error('Error calculating user entitlements:', error);
    cacheStats.errors++;
    throw error;
  }
}

/**
 * Invalidate the entitlements cache for a user
 *
 * @param userId The user ID to invalidate the cache for
 */
export function invalidateUserEntitlements(userId: string): void {
  try {
    const key = getCacheKey(userId);
    sessionStorage.removeItem(key);
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
    // Find all entitlements cache keys
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

    logDebug('Cleared entire entitlements cache', { keysRemoved: keysToRemove.length });
  } catch (error) {
    console.error('Failed to clear entitlements cache:', error);
    cacheStats.errors++;
  }
}

/**
 * Get the timestamp of when the entitlements were last calculated for a user
 *
 * @param userId The user ID to get the timestamp for
 * @returns The timestamp in milliseconds, or null if not cached
 */
export function getEntitlementsCacheTimestamp(userId: string): number | null {
  const cache = loadFromStorage(userId);
  return cache?.timestamp || null;
}

/**
 * Check if the entitlements cache for a user is expired
 *
 * @param userId The user ID to check
 * @returns True if the cache is expired or doesn't exist, false otherwise
 */
export function isEntitlementsCacheExpired(userId: string): boolean {
  const cache = loadFromStorage(userId);
  return !isCacheValid(cache, userId);
}

/**
 * Get all cached user IDs
 *
 * @returns An array of user IDs that have cached entitlements
 */
export function getCachedUserIds(): string[] {
  try {
    const userIds: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
        const userId = key.substring(CACHE_CONFIG.KEY_PREFIX.length);
        userIds.push(userId);
      }
    }

    return userIds;
  } catch (error) {
    console.error('Failed to get cached user IDs:', error);
    cacheStats.errors++;
    return [];
  }
}

/**
 * Get the size of the entitlements cache
 *
 * @returns The number of users with cached entitlements
 */
export function getEntitlementsCacheSize(): number {
  return getCachedUserIds().length;
}

/**
 * Configure the cache settings
 *
 * @param config Configuration options
 */
export function configureEntitlementsCache(config: Partial<typeof CACHE_CONFIG>): void {
  Object.assign(CACHE_CONFIG, config);
  logDebug('Updated cache configuration', { config: CACHE_CONFIG });
}

/**
 * Get cache statistics
 *
 * @returns The current cache statistics
 */
export function getEntitlementsCacheStats(): CacheStats {
  return { ...cacheStats };
}

/**
 * Reset cache statistics
 */
export function resetEntitlementsCacheStats(): void {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.errors = 0;
  logDebug('Reset cache statistics');
}
