/**
 * Entitlements Cache Core
 *
 * This module provides core cache operations for entitlements.
 */

import { UserRole } from '../roles';

// Cache configuration
export const CACHE_CONFIG = {
  // Cache expiration time in milliseconds (5 minutes by default)
  EXPIRATION: 5 * 60 * 1000,
  // Storage key prefix for sessionStorage
  KEY_PREFIX: 'entitlements_cache_',
  // Current cache version - increment when cache structure changes
  VERSION: 2, // Incremented for enhanced cache structure
  // Enable debug logging
  DEBUG: false,
  // Real-time invalidation settings
  REALTIME_ENABLED: true,
  // Multi-level cache settings
  MEMORY_CACHE_SIZE: 50, // Max users to keep in memory
  MEMORY_CACHE_TTL: 2 * 60 * 1000 // 2 minutes for memory cache
};

// Enhanced cache structure with roles and permissions
export interface EntitlementsCache {
  entitlements: string[];
  roles: UserRole[];
  permissions: Permission[];
  version: number;
  timestamp: number;
  userId: string;
  computationTime?: number; // Track how long it took to compute
}

// Permission interface for detailed tracking
export interface Permission {
  name: string;
  contextId?: string;
  inherited: boolean;
  source: string; // Which role granted this permission
}

// Multi-level cache with memory and storage
export interface MemoryCacheEntry {
  cache: EntitlementsCache;
  accessCount: number;
  lastAccessed: number;
}

// Cache statistics for monitoring
export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
}

// Initialize cache statistics
export const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  errors: 0
};

/**
 * Helper function to log debug messages
 */
export function logDebug(message: string, ...args: any[]): void {
  if (CACHE_CONFIG.DEBUG) {
    console.debug(`[EntitlementsCache] ${message}`, ...args);
  }
}

/**
 * Create detailed permissions array from entitlements and roles
 */
export function createPermissionsArray(entitlements: string[], roles: UserRole[]): Permission[] {
  const permissions: Permission[] = [];

  // Add direct entitlements
  entitlements.forEach(entitlement => {
    permissions.push({
      name: entitlement,
      inherited: false,
      source: 'direct'
    });
  });

  // Add role-based permissions (simplified for now)
  roles.forEach(role => {
    permissions.push({
      name: `ROLE_${role.role}`,
      contextId: role.contextId,
      inherited: true,
      source: role.role
    });
  });

  return permissions;
}

/**
 * Get the cache key for a user
 */
export function getCacheKey(userId: string): string {
  return `${CACHE_CONFIG.KEY_PREFIX}${userId}`;
}

/**
 * Save cache entry to sessionStorage
 */
export function saveToStorage(userId: string, cache: EntitlementsCache): void {
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
export function loadFromStorage(userId: string): EntitlementsCache | null {
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
export function isCacheValid(cache: EntitlementsCache | null, userId: string): boolean {
  if (!cache) {
    return false;
  }

  const now = Date.now();
  const isExpired = now - cache.timestamp >= CACHE_CONFIG.EXPIRATION;

  // For backward compatibility, accept both version 1 and 2
  const isVersionMatch = cache.version === CACHE_CONFIG.VERSION || cache.version === 1;
  const isUserMatch = cache.userId === userId;

  return !isExpired && isVersionMatch && isUserMatch;
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
