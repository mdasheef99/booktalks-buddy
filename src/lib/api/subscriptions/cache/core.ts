/**
 * Core Cache Operations Module
 *
 * Implements basic cache operations including get, set, delete, cache key generation,
 * TTL management, and core cache interface. Extracted from cache.ts refactoring.
 *
 * Created: 2025-07-10
 * Part of: Phase 1A - cache.ts Refactoring
 */

import type { SubscriptionStatus } from '../types';
import type {
  CacheEntry,
  CacheStats,
  CacheConfig,
  CacheOperationResult,
} from './types';
import { DEFAULT_CACHE_CONFIG, CACHE_CLEANUP_INTERVAL } from './types';
import { CachePerformanceMonitor } from './performance';
import {
  calculateIntelligentTTL,
  generateSubscriptionAwareCacheKey,
  validateCacheEntrySubscription
} from './subscription-aware';
import { setupCleanupInterval, cleanupExpiredEntries, invalidateOnSubscriptionChange } from './invalidation';

// =========================
// Core Cache Class
// =========================

/**
 * Core subscription cache implementation with basic operations
 */
export class SubscriptionCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  public performanceMonitor: CachePerformanceMonitor;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.performanceMonitor = new CachePerformanceMonitor();

    // Start cleanup interval using the invalidation module
    this.cleanupInterval = setupCleanupInterval(() => this.performCleanup());

    console.log('[Cache] Subscription cache initialized with config:', this.config);
  }

  /**
   * Get subscription status from cache
   */
  async get(userId: string): Promise<{ data: SubscriptionStatus | null; result: CacheOperationResult }> {
    const startTime = Date.now();

    try {
      const key = generateSubscriptionAwareCacheKey(userId, this.config.keyPrefix);
      const entry = this.cache.get(key);

      if (!entry) {
        this.performanceMonitor.recordMiss(Date.now() - startTime);
        return { data: null, result: 'miss' };
      }

      // Validate cache entry using subscription-aware validation
      const validation = validateCacheEntrySubscription(entry);

      if (!validation.isValid) {
        this.cache.delete(key);
        this.performanceMonitor.recordMiss(Date.now() - startTime);
        return { data: null, result: 'expired' };
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();

      this.performanceMonitor.recordHit(Date.now() - startTime);

      console.log(`[Cache] Hit for user ${userId} (accessed ${entry.accessCount} times)`);
      return { data: entry.data, result: 'hit' };

    } catch (error) {
      console.error('[Cache] Error retrieving from cache:', error);
      this.performanceMonitor.recordMiss(Date.now() - startTime);
      return { data: null, result: 'error' };
    }
  }

  /**
   * Set subscription status in cache with intelligent TTL
   */
  async set(userId: string, data: SubscriptionStatus): Promise<CacheOperationResult> {
    try {
      const key = generateSubscriptionAwareCacheKey(userId, this.config.keyPrefix, data.subscriptionExpiry);
      const now = Date.now();

      // Calculate intelligent TTL using subscription-aware module
      const ttl = calculateIntelligentTTL(data, this.config.ttl);
      const expiresAt = now + (ttl * 1000);

      const entry: CacheEntry = {
        data,
        timestamp: now,
        expiresAt,
        subscriptionExpiry: data.subscriptionExpiry,
        accessCount: 0,
        lastAccessed: now,
      };

      // Ensure we don't exceed max entries
      if (this.cache.size >= this.config.maxEntries) {
        this.evictLeastRecentlyUsed();
      }

      this.cache.set(key, entry);

      console.log(`[Cache] Set for user ${userId} with TTL ${ttl}s (expires: ${new Date(expiresAt).toISOString()})`);
      return 'hit';

    } catch (error) {
      console.error('[Cache] Error setting cache:', error);
      return 'error';
    }
  }

  /**
   * Delete cache entry for a specific user
   */
  async delete(userId: string): Promise<boolean> {
    try {
      const key = generateSubscriptionAwareCacheKey(userId, this.config.keyPrefix);
      const deleted = this.cache.delete(key);

      if (deleted) {
        console.log(`[Cache] Deleted cache entry for user ${userId}`);
      }

      return deleted;
    } catch (error) {
      console.error('[Cache] Error deleting cache entry:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[Cache] Cleared all ${size} cache entries`);
  }

  /**
   * Invalidate cache entry based on subscription lifecycle event
   */
  async invalidateOnSubscriptionEvent(
    userId: string,
    changeType: 'subscription_created' | 'subscription_expired' | 'subscription_renewed' | 'tier_change'
  ): Promise<boolean> {
    const result = await invalidateOnSubscriptionChange(
      this.cache,
      userId,
      changeType,
      this.config.keyPrefix
    );

    // Record invalidation metrics
    if (result) {
      this.performanceMonitor.recordInvalidation('subscription');
    }

    return result;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.performanceMonitor.getStats();
  }

  /**
   * Get cache size and memory usage info
   */
  getInfo(): { size: number; maxEntries: number; memoryUsage: string } {
    const size = this.cache.size;
    const memoryUsage = `${Math.round((size * 1024) / 1024 * 100) / 100} MB (estimated)`;

    return {
      size,
      maxEntries: this.config.maxEntries,
      memoryUsage,
    };
  }

  // =========================
  // Private Helper Methods
  // =========================

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    // Convert to array to avoid iterator issues
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.performanceMonitor.recordEviction();
      console.log(`[Cache] Evicted LRU entry: ${oldestKey}`);
    }
  }

  /**
   * Perform cleanup using invalidation module
   */
  private performCleanup(): number {
    return cleanupExpiredEntries(this.cache);
  }

  /**
   * Cleanup resources when cache is destroyed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    console.log('[Cache] Cache destroyed and resources cleaned up');
  }
}
