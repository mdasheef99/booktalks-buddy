/**
 * Entitlements Cache Main
 *
 * This module provides the main cache API and orchestrates core and enhanced cache operations.
 */

import { calculateUserEntitlements } from '../membership';
import { getUserRoles, UserRole } from '../roles';

// Import specific functions to avoid conflicts
import {
  CACHE_CONFIG,
  EntitlementsCache,
  cacheStats,
  logDebug,
  createPermissionsArray,
  isCacheValid,
  loadFromStorage,
  saveToStorage
} from './core';

import {
  saveToMemoryCache,
  loadFromMemoryCache,
  invalidateUserEntitlements,
  clearEntitlementsCache,
  addCacheInvalidationListener,
  invalidateMultipleUsers,
  getMemoryCacheStats,
  preloadUserEntitlements,
  cleanupExpiredCache,
  clearMemoryCache
} from './enhanced';

// Re-export core functionality
export * from './core';
export * from './enhanced';

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

  // Try to load from memory cache first (fastest)
  if (!forceRefresh) {
    const memoryCache = loadFromMemoryCache(userId);
    if (memoryCache && isCacheValid(memoryCache, userId)) {
      cacheStats.hits++;
      logDebug('Memory cache hit', { userId, stats: cacheStats });
      return memoryCache.entitlements;
    }

    // Try to load from sessionStorage
    const storageCache = loadFromStorage(userId);
    if (isCacheValid(storageCache, userId)) {
      // Promote to memory cache
      if (storageCache) {
        saveToMemoryCache(userId, storageCache);
      }
      cacheStats.hits++;
      logDebug('Storage cache hit', { userId, stats: cacheStats });
      return storageCache.entitlements;
    }

    cacheStats.misses++;
    logDebug('Cache miss or expired', { userId, stats: cacheStats });
  } else {
    logDebug('Force refresh requested', { userId });
  }

  // Calculate fresh entitlements and roles
  try {
    const startTime = Date.now();

    // Always calculate entitlements
    const entitlements = await calculateUserEntitlements(userId);

    // Try to get roles, but don't fail if it doesn't work
    let roles: UserRole[] = [];
    let permissions: any[] = [];

    try {
      roles = await getUserRoles(userId);
      permissions = createPermissionsArray(entitlements, roles);
    } catch (roleError) {
      console.warn('Could not fetch user roles, using basic cache structure:', roleError);
      // Create basic permissions from entitlements only
      permissions = entitlements.map((entitlement: string) => ({
        name: entitlement,
        inherited: false,
        source: 'direct'
      }));
    }

    const computationTime = Date.now() - startTime;

    // Create new cache entry
    const cacheEntry: EntitlementsCache = {
      entitlements,
      roles,
      permissions,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now(),
      userId,
      computationTime
    };

    // Save to both memory and storage
    saveToMemoryCache(userId, cacheEntry);
    saveToStorage(userId, cacheEntry);

    return entitlements;
  } catch (error) {
    console.error('Error calculating user entitlements:', error);
    cacheStats.errors++;
    throw error;
  }
}

/**
 * Get enhanced user entitlements with roles and permissions
 *
 * @param userId The user ID to get entitlements for
 * @param forceRefresh Whether to force a refresh of the cache
 * @returns Promise<EntitlementsCache> Complete cache entry with roles and permissions
 */
export async function getEnhancedUserEntitlements(
  userId: string,
  forceRefresh = false
): Promise<EntitlementsCache | null> {
  if (!userId) {
    return null;
  }

  // Try memory cache first
  if (!forceRefresh) {
    const memoryCache = loadFromMemoryCache(userId);
    if (memoryCache && isCacheValid(memoryCache, userId)) {
      return memoryCache;
    }

    // Try storage cache
    const storageCache = loadFromStorage(userId);
    if (isCacheValid(storageCache, userId)) {
      if (storageCache) {
        saveToMemoryCache(userId, storageCache);
        return storageCache;
      }
    }
  }

  // Force refresh by calling getUserEntitlements which will populate the cache
  await getUserEntitlements(userId, forceRefresh);

  // Return the newly cached data
  return loadFromMemoryCache(userId) || loadFromStorage(userId);
}

// Note: All functions and types are already re-exported via export * above

/**
 * Preload cache for multiple users (wrapper with proper function injection)
 */
export async function preloadCache(userIds: string[]): Promise<void> {
  return preloadUserEntitlements(userIds, getUserEntitlements);
}
