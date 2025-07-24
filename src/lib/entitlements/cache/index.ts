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

// =========================
// Circuit Breaker for Infinite Loop Prevention
// =========================

// 🚨 CRITICAL SAFEGUARD: Prevent infinite recursion in getUserEntitlements
const entitlementCalculationInProgress = new Set<string>();
const pendingEntitlementPromises = new Map<string, Promise<string[]>>();

function preventInfiniteEntitlementLoop(userId: string): { canProceed: boolean; cleanup: () => void } {
  const key = `entitlements-${userId}`;

  if (entitlementCalculationInProgress.has(key)) {
    console.warn(`🚨 CIRCUIT BREAKER: Entitlement calculation already in progress for user ${userId}`);
    return { canProceed: false, cleanup: () => {} };
  }

  entitlementCalculationInProgress.add(key);
  console.log(`[Circuit Breaker] Started entitlement calculation for user ${userId}`);

  const cleanup = () => {
    entitlementCalculationInProgress.delete(key);
    pendingEntitlementPromises.delete(key);
    console.log(`[Circuit Breaker] Completed entitlement calculation for user ${userId}`);
  };

  // Auto-cleanup after 5 seconds to prevent permanent blocks (reduced since we have promise deduplication)
  setTimeout(cleanup, 5000);

  return { canProceed: true, cleanup };
}

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

  // 🚨 CRITICAL SAFEGUARD: Check if calculation already in progress
  const key = `entitlements-${userId}`;

  // If there's already a pending promise for this user, return it instead of starting a new calculation
  if (pendingEntitlementPromises.has(key)) {
    console.log(`[Deduplication] Returning existing promise for user ${userId}`);
    return pendingEntitlementPromises.get(key)!;
  }

  // Circuit breaker to prevent infinite recursion
  const { canProceed, cleanup } = preventInfiniteEntitlementLoop(userId);
  if (!canProceed) {
    console.warn(`[Circuit Breaker] Returning empty entitlements for user ${userId} due to infinite loop prevention`);
    return [];
  }

  // 🚨 PERFORMANCE FIX: Create and store the promise to prevent duplicate calculations
  const calculationPromise = (async (): Promise<string[]> => {
    try {
      // Try to load from memory cache first (fastest)
      if (!forceRefresh) {
        const memoryCache = loadFromMemoryCache(userId);
        if (memoryCache && isCacheValid(memoryCache, userId)) {
          cacheStats.hits++;
          logDebug('Memory cache hit', { userId, stats: cacheStats });
          cleanup();
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
          cleanup();
          return storageCache.entitlements;
        }

        cacheStats.misses++;
        logDebug('Cache miss or expired', { userId, stats: cacheStats });
      } else {
        logDebug('Force refresh requested', { userId });
      }

      // Calculate fresh entitlements and roles
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

      // 🚨 CRITICAL SAFEGUARD: Clean up circuit breaker
      cleanup();
      return entitlements;
    } catch (error) {
      console.error('Error calculating user entitlements:', error);
      cacheStats.errors++;
      // 🚨 CRITICAL SAFEGUARD: Clean up circuit breaker on error
      cleanup();
      throw error;
    }
  })();

  // Store the promise to prevent duplicate calculations
  pendingEntitlementPromises.set(key, calculationPromise);

  return calculationPromise;
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

  // 🚨 CRITICAL FIX: Calculate entitlements directly instead of recursive call
  // This prevents the infinite loop: getEnhancedUserEntitlements() → getUserEntitlements() → getEnhancedUserEntitlements()

  try {
    console.log(`[Cache] Force refresh - calculating entitlements directly for user ${userId}`);
    const startTime = Date.now();

    // Calculate fresh entitlements directly (same logic as getUserEntitlements but without recursion)
    const entitlements = await calculateUserEntitlements(userId);

    // Try to get roles, but don't fail if it doesn't work
    let roles: UserRole[] = [];
    let permissions: any[] = [];

    try {
      roles = await getUserRoles(userId);
      permissions = createPermissionsArray(entitlements, roles);
    } catch (roleError) {
      console.warn('Could not fetch user roles during cache refresh, using basic structure:', roleError);
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

    console.log(`[Cache] Direct calculation completed in ${computationTime}ms for user ${userId}`);
    return cacheEntry;

  } catch (error) {
    console.error('Error in direct entitlements calculation:', error);
    // Return null to indicate cache refresh failed
    return null;
  }
}

// Note: All functions and types are already re-exported via export * above

/**
 * Preload cache for multiple users (wrapper with proper function injection)
 */
export async function preloadCache(userIds: string[]): Promise<void> {
  return preloadUserEntitlements(userIds, getUserEntitlements);
}
