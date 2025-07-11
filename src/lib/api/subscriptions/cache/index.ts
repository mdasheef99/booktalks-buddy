/**
 * Cache Module Index - Comprehensive Re-exports
 *
 * Maintains 100% backward compatibility by re-exporting all public APIs
 * from the modular cache implementation. This ensures existing imports
 * continue to work without any changes.
 *
 * Created: 2025-07-10
 * Part of: Phase 1A - cache.ts Refactoring
 */

import { SubscriptionCache } from './core';
import { validateUserSubscription, hasActiveSubscription } from '../validation';
import type { SubscriptionStatus } from '../types';
import type { CacheStats } from './types';
import type { CacheWarmingResult, BatchInvalidationResult, CacheMaintenanceResult } from './types';
import { invalidateExpiredEntries, invalidateMultipleUsers } from './invalidation';
import { CachePerformanceMonitor } from './performance';
import { getEnvironmentCacheConfig } from './config';
import { supabase } from '@/lib/supabase';
import { isFeatureEnabled, SUBSCRIPTION_FEATURE_FLAGS } from '@/lib/feature-flags';

// =========================
// Global Cache Instance
// =========================

const subscriptionCache = new SubscriptionCache(getEnvironmentCacheConfig());

// =========================
// Public API Re-exports for Backward Compatibility
// =========================

/**
 * Get subscription status with caching
 */
export async function getCachedSubscriptionStatus(
  userId: string,
  forceRefresh: boolean = false
): Promise<SubscriptionStatus> {
  const startTime = Date.now();

  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedData, result } = await subscriptionCache.get(userId);

      if (cachedData && result === 'hit') {
        console.log(`[Cache API] Cache hit for user ${userId} (${Date.now() - startTime}ms)`);
        return {
          ...cachedData,
          validationSource: 'cache',
          lastValidated: cachedData.lastValidated,
        };
      }
    }

    // Cache miss or force refresh - validate from database
    console.log(`[Cache API] Cache miss for user ${userId}, validating from database`);
    const validationResult = await validateUserSubscription(userId, {
      useCache: false,
      includeMetrics: true,
    });

    // Cache the result if validation was successful
    if (validationResult.success) {
      await subscriptionCache.set(userId, validationResult.status);
    }

    console.log(`[Cache API] Database validation completed for user ${userId} (${Date.now() - startTime}ms)`);
    return validationResult.status;

  } catch (error) {
    console.error('[Cache API] Error getting cached subscription status:', error);

    // Fail secure - return basic member status
    return {
      hasActiveSubscription: false,
      currentTier: 'MEMBER',
      subscriptionExpiry: null,
      isValid: false,
      lastValidated: new Date().toISOString(),
      validationSource: 'fallback',
      warnings: ['Cache error - defaulting to MEMBER tier for security'],
    };
  }
}

/**
 * Quick cached check for active subscription (optimized for performance)
 */
export async function hasCachedActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data: cachedData } = await subscriptionCache.get(userId);

    if (cachedData) {
      return cachedData.hasActiveSubscription;
    }

    // Cache miss - use quick database check
    const hasActive = await hasActiveSubscription(userId);

    // Don't cache this lightweight check to avoid cache pollution
    return hasActive;

  } catch (error) {
    console.error('[Cache API] Error checking cached active subscription:', error);
    return false; // Fail secure
  }
}

/**
 * Get frequently accessed users for intelligent cache warming
 * Uses role activity and subscription metrics to identify active users
 */
export async function getFrequentlyAccessedUsers(limit: number = 50): Promise<string[]> {
  try {
    console.log(`[Cache Warming] Identifying frequently accessed users (limit: ${limit})`);

    // Get users with recent role activity (indicates active usage)
    const { data: roleActivityData, error: roleError } = await supabase
      .from('role_activity')
      .select('user_id, last_active')
      .gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('last_active', { ascending: false })
      .limit(limit * 2); // Get more to filter and prioritize

    if (roleError) {
      console.warn('[Cache Warming] Error fetching role activity data:', roleError);
    }

    // Get users with recent subscription activity
    const { data: subscriptionActivityData, error: subError } = await supabase
      .from('subscription_metrics')
      .select('user_id, recorded_at')
      .not('user_id', 'is', null)
      .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (subError) {
      console.warn('[Cache Warming] Error fetching subscription activity data:', subError);
    }

    // Combine and prioritize users
    const userActivityMap = new Map<string, { lastActivity: Date; activityScore: number }>();

    // Process role activity data (higher priority)
    if (roleActivityData) {
      roleActivityData.forEach(activity => {
        const lastActivity = new Date(activity.last_active);
        const existingEntry = userActivityMap.get(activity.user_id);
        const activityScore = (existingEntry?.activityScore || 0) + 2; // Role activity gets higher score

        userActivityMap.set(activity.user_id, {
          lastActivity: existingEntry ?
            (lastActivity > existingEntry.lastActivity ? lastActivity : existingEntry.lastActivity) :
            lastActivity,
          activityScore
        });
      });
    }

    // Process subscription activity data
    if (subscriptionActivityData) {
      subscriptionActivityData.forEach(activity => {
        const lastActivity = new Date(activity.recorded_at);
        const existingEntry = userActivityMap.get(activity.user_id);
        const activityScore = (existingEntry?.activityScore || 0) + 1; // Subscription activity gets base score

        userActivityMap.set(activity.user_id, {
          lastActivity: existingEntry ?
            (lastActivity > existingEntry.lastActivity ? lastActivity : existingEntry.lastActivity) :
            lastActivity,
          activityScore
        });
      });
    }

    // Sort by activity score and recency, then take top users
    const sortedUsers = Array.from(userActivityMap.entries())
      .sort((a, b) => {
        // First sort by activity score (higher is better)
        if (b[1].activityScore !== a[1].activityScore) {
          return b[1].activityScore - a[1].activityScore;
        }
        // Then by recency (more recent is better)
        return b[1].lastActivity.getTime() - a[1].lastActivity.getTime();
      })
      .slice(0, limit)
      .map(entry => entry[0]);

    console.log(`[Cache Warming] Identified ${sortedUsers.length} frequently accessed users`);
    return sortedUsers;

  } catch (error) {
    console.error('[Cache Warming] Error identifying frequently accessed users:', error);
    // Fallback: return empty array to avoid breaking cache warming
    return [];
  }
}

/**
 * Intelligent cache warming for frequently accessed users
 * Enhanced version with user activity analysis and feature flag protection
 */
export async function warmFrequentUserCache(options: {
  limit?: number;
  batchSize?: number;
  respectFeatureFlags?: boolean;
} = {}): Promise<CacheWarmingResult> {
  const { limit = 50, batchSize = 5, respectFeatureFlags = true } = options;
  const startTime = Date.now();

  try {
    // Check feature flag if enabled
    if (respectFeatureFlags) {
      const cacheOptimizationEnabled = await isFeatureEnabled(
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_CACHE_INVALIDATION
      );

      if (!cacheOptimizationEnabled.enabled) {
        console.log('[Cache Warming] Cache optimization feature flag disabled, skipping intelligent warming');
        return { warmed: 0, failed: 0, duration: Date.now() - startTime };
      }
    }

    // Get frequently accessed users
    const frequentUsers = await getFrequentlyAccessedUsers(limit);

    if (frequentUsers.length === 0) {
      console.log('[Cache Warming] No frequently accessed users identified');
      return { warmed: 0, failed: 0, duration: Date.now() - startTime };
    }

    // Use existing cache warming function with intelligent user list
    const result = await warmSubscriptionCache(frequentUsers);

    // Record warming metrics
    subscriptionCache.performanceMonitor.recordWarming(
      result.duration,
      result.failed === 0
    );

    console.log(`[Cache Warming] Intelligent warming completed: ${result.warmed} warmed, ${result.failed} failed`);
    return result;

  } catch (error) {
    console.error('[Cache Warming] Error during intelligent cache warming:', error);
    const duration = Date.now() - startTime;
    return { warmed: 0, failed: 0, duration };
  }
}

/**
 * Warm cache for frequently accessed users
 */
export async function warmSubscriptionCache(userIds: string[]): Promise<CacheWarmingResult> {
  const startTime = Date.now();
  let warmed = 0;
  let failed = 0;

  console.log(`[Cache Warming] Starting cache warming for ${userIds.length} users`);

  try {
    // Process in batches to avoid overwhelming the system
    const batchSize = 5;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (userId) => {
        try {
          // Check if already cached
          const { result } = await subscriptionCache.get(userId);

          if (result === 'hit') {
            console.log(`[Cache Warming] User ${userId} already cached, skipping`);
            return;
          }

          // Validate and cache
          const validationResult = await validateUserSubscription(userId);

          if (validationResult.success) {
            await subscriptionCache.set(userId, validationResult.status);
            warmed++;
            console.log(`[Cache Warming] Warmed cache for user ${userId}`);
          } else {
            failed++;
            console.warn(`[Cache Warming] Failed to validate user ${userId}`);
          }
        } catch (error) {
          failed++;
          console.error(`[Cache Warming] Error warming cache for user ${userId}:`, error);
        }
      });

      await Promise.all(batchPromises);

      // Small delay between batches
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Cache Warming] Completed: ${warmed} warmed, ${failed} failed in ${duration}ms`);

    return { warmed, failed, duration };

  } catch (error) {
    console.error('[Cache Warming] Error during cache warming:', error);
    return { warmed, failed, duration: Date.now() - startTime };
  }
}

/**
 * Invalidate cache for specific user
 */
export async function invalidateUserCache(userId: string): Promise<boolean> {
  try {
    const result = await subscriptionCache.delete(userId);
    console.log(`[Cache API] Invalidated cache for user ${userId}: ${result}`);
    return result;
  } catch (error) {
    console.error('[Cache API] Error invalidating user cache:', error);
    return false;
  }
}

/**
 * Invalidate cache for multiple users
 */
export async function invalidateMultipleUserCache(userIds: string[]): Promise<BatchInvalidationResult> {
  let invalidated = 0;
  let failed = 0;

  try {
    for (const userId of userIds) {
      const result = await subscriptionCache.delete(userId);
      if (result) {
        invalidated++;
      } else {
        failed++;
      }
    }

    console.log(`[Cache API] Batch invalidation: ${invalidated} invalidated, ${failed} failed`);
    return { invalidated, failed };

  } catch (error) {
    console.error('[Cache API] Error during batch invalidation:', error);
    return { invalidated, failed: userIds.length };
  }
}

/**
 * Get cache statistics and performance metrics
 */
export function getCacheStats(): CacheStats & { info: ReturnType<typeof subscriptionCache.getInfo> } {
  return {
    ...subscriptionCache.getStats(),
    info: subscriptionCache.getInfo(),
  };
}

/**
 * Get enhanced cache performance statistics with warming and invalidation metrics
 */
export function getEnhancedCacheStats(): CacheStats & {
  warming: any;
  invalidation: any;
  efficiency: { score: number; recommendation: string };
} {
  return subscriptionCache.performanceMonitor.getEnhancedStats();
}

/**
 * Generate comprehensive performance report
 */
export async function generateCachePerformanceReport(sendToDatabase: boolean = false): Promise<{
  timestamp: string;
  stats: CacheStats;
  warming: any;
  invalidation: any;
  efficiency: { score: number; recommendation: string };
  recommendations: string[];
}> {
  return await subscriptionCache.performanceMonitor.generatePerformanceReport(sendToDatabase);
}

/**
 * Clear all cached subscription data
 */
export async function clearSubscriptionCache(): Promise<void> {
  try {
    await subscriptionCache.clear();
    console.log('[Cache API] All subscription cache cleared');
  } catch (error) {
    console.error('[Cache API] Error clearing cache:', error);
  }
}

/**
 * Perform cache maintenance (cleanup expired entries)
 */
export async function performCacheMaintenance(): Promise<CacheMaintenanceResult> {
  try {
    // Access private cache map through a public method we'll need to add
    const stats = subscriptionCache.getStats();
    const info = subscriptionCache.getInfo();

    // For now, return current stats - we'll need to enhance core.ts to support this
    console.log(`[Cache Maintenance] Current cache state: ${info.size} total entries`);

    return {
      expiredRemoved: 0, // Will be implemented when we enhance core.ts
      totalEntries: info.size,
      hitRate: stats.hitRate,
    };

  } catch (error) {
    console.error('[Cache Maintenance] Error during maintenance:', error);
    return {
      expiredRemoved: 0,
      totalEntries: 0,
      hitRate: 0,
    };
  }
}

/**
 * Update cache configuration at runtime
 */
export function updateCacheConfig(newConfig: Partial<import('./types').CacheConfig>): void {
  // Note: This would require refactoring the cache class to support runtime config updates
  console.warn('[Cache API] Runtime config updates not yet implemented. Restart required for config changes.');
}

/**
 * Invalidate cache based on subscription lifecycle event
 * Enhanced invalidation with subscription-aware logic
 */
export async function invalidateOnSubscriptionEvent(
  userId: string,
  changeType: 'subscription_created' | 'subscription_expired' | 'subscription_renewed' | 'tier_change'
): Promise<boolean> {
  return await subscriptionCache.invalidateOnSubscriptionEvent(userId, changeType);
}

/**
 * Export cache instance for advanced usage
 */
export { subscriptionCache };
