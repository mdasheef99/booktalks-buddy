/**
 * Cache-Specific Type Definitions
 *
 * Type definitions specifically for the subscription caching system.
 * Extracted from the main types.ts file as part of cache.ts refactoring.
 *
 * Created: 2025-07-10
 * Part of: Phase 1A - cache.ts Refactoring
 */

import type { SubscriptionStatus } from '../types';

// =========================
// Cache Entry Types
// =========================

/**
 * Internal cache entry structure
 */
export interface CacheEntry {
  /** Cached subscription status data */
  data: SubscriptionStatus;

  /** Timestamp when entry was created */
  timestamp: number;

  /** Timestamp when entry expires */
  expiresAt: number;

  /** Subscription expiry date for intelligent invalidation */
  subscriptionExpiry: string | null;

  /** Number of times this entry has been accessed */
  accessCount: number;

  /** Timestamp of last access */
  lastAccessed: number;
}

/**
 * Cache performance statistics
 */
export interface CacheStats {
  /** Number of cache hits */
  hits: number;

  /** Number of cache misses */
  misses: number;

  /** Number of entries evicted due to space constraints */
  evictions: number;

  /** Total number of cache requests */
  totalRequests: number;

  /** Cache hit rate (0-1) */
  hitRate: number;

  /** Average response time in milliseconds */
  averageResponseTime: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Cache TTL in seconds */
  ttl: number;

  /** Maximum number of entries in cache */
  maxEntries: number;

  /** Whether to enable cache compression */
  compression: boolean;

  /** Cache key prefix */
  keyPrefix: string;
}

// =========================
// Cache Operation Types
// =========================

/**
 * Result of cache operations
 */
export type CacheOperationResult = 'hit' | 'miss' | 'error' | 'expired' | 'invalid';

/**
 * Cache warming operation result
 */
export interface CacheWarmingResult {
  /** Number of entries successfully warmed */
  warmed: number;

  /** Number of entries that failed to warm */
  failed: number;

  /** Total duration of warming operation in milliseconds */
  duration: number;
}

/**
 * Cache maintenance operation result
 */
export interface CacheMaintenanceResult {
  /** Number of expired entries removed */
  expiredRemoved: number;

  /** Total number of entries remaining */
  totalEntries: number;

  /** Current cache hit rate */
  hitRate: number;
}

/**
 * Batch cache invalidation result
 */
export interface BatchInvalidationResult {
  /** Number of entries successfully invalidated */
  invalidated: number;

  /** Number of entries that failed to invalidate */
  failed: number;
}

// =========================
// Cache Constants
// =========================

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 300, // 5 minutes
  maxEntries: 10000,
  compression: true,
  keyPrefix: 'subscription:',
};

/**
 * Minimum cache TTL in seconds
 */
export const MIN_CACHE_TTL = 60;

/**
 * Cache cleanup interval in milliseconds (5 minutes)
 */
export const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * Default batch size for cache operations
 */
export const DEFAULT_BATCH_SIZE = 5;

/**
 * Default delay between batches in milliseconds
 */
export const DEFAULT_BATCH_DELAY = 100;
