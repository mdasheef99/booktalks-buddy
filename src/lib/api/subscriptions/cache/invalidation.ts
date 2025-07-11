/**
 * Cache Invalidation Module
 *
 * Handles subscription-based invalidation, event-driven cache clearing,
 * and cleanup procedures. Extracted from cache.ts refactoring.
 *
 * Created: 2025-07-10
 * Part of: Phase 1A - cache.ts Refactoring
 */

import type { CacheEntry, BatchInvalidationResult } from './types';
import { CACHE_CLEANUP_INTERVAL } from './types';
import { supabase } from '@/lib/supabase';
import { isFeatureEnabled, SUBSCRIPTION_FEATURE_FLAGS } from '@/lib/feature-flags';

// =========================
// Cache Invalidation Functions
// =========================

/**
 * Invalidate cache entries for users with expired subscriptions
 */
export function invalidateExpiredEntries(
  cache: Map<string, CacheEntry>
): number {
  let invalidatedCount = 0;
  const now = Date.now();

  try {
    // Convert to array to avoid iterator issues
    const entries = Array.from(cache.entries());
    for (const [key, entry] of entries) {
      let shouldInvalidate = false;

      // Check cache expiry
      if (entry.expiresAt <= now) {
        shouldInvalidate = true;
      }

      // Check subscription expiry
      if (entry.subscriptionExpiry) {
        const subscriptionExpiry = new Date(entry.subscriptionExpiry).getTime();
        if (subscriptionExpiry <= now) {
          shouldInvalidate = true;
        }
      }

      if (shouldInvalidate) {
        cache.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      console.log(`[Cache Invalidation] Invalidated ${invalidatedCount} expired entries`);
    }

    return invalidatedCount;
  } catch (error) {
    console.error('[Cache Invalidation] Error invalidating expired entries:', error);
    return 0;
  }
}

/**
 * Invalidate cache entries for multiple users
 */
export function invalidateMultipleUsers(
  cache: Map<string, CacheEntry>,
  userIds: string[],
  keyPrefix: string
): { invalidated: number; failed: number } {
  let invalidated = 0;
  let failed = 0;

  try {
    for (const userId of userIds) {
      const key = `${keyPrefix}${userId}`;
      if (cache.delete(key)) {
        invalidated++;
      } else {
        failed++;
      }
    }

    console.log(`[Cache Invalidation] Batch invalidation: ${invalidated} invalidated, ${failed} failed`);
    return { invalidated, failed };

  } catch (error) {
    console.error('[Cache Invalidation] Error during batch invalidation:', error);
    return { invalidated, failed: userIds.length };
  }
}

/**
 * Setup automatic cleanup interval for expired entries
 */
export function setupCleanupInterval(
  cleanupFunction: () => number
): NodeJS.Timeout {
  return setInterval(() => {
    cleanupFunction();
  }, CACHE_CLEANUP_INTERVAL);
}

/**
 * Enhanced subscription-aware invalidation based on subscription lifecycle events
 */
export async function invalidateOnSubscriptionChange(
  cache: Map<string, CacheEntry>,
  userId: string,
  changeType: 'subscription_created' | 'subscription_expired' | 'subscription_renewed' | 'tier_change',
  keyPrefix: string
): Promise<boolean> {
  try {
    // Check feature flag for enhanced invalidation
    const enhancedInvalidationEnabled = await isFeatureEnabled(
      SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_CACHE_INVALIDATION
    );

    if (!enhancedInvalidationEnabled.enabled) {
      // Fall back to basic invalidation
      const key = `${keyPrefix}${userId}`;
      const deleted = cache.delete(key);
      console.log(`[Cache Invalidation] Basic invalidation for user ${userId}: ${deleted ? 'success' : 'not found'}`);
      return deleted;
    }

    // Enhanced invalidation logic based on change type
    const key = `${keyPrefix}${userId}`;
    let invalidated = false;

    switch (changeType) {
      case 'subscription_created':
      case 'subscription_renewed':
        // For new/renewed subscriptions, invalidate to ensure fresh data
        invalidated = cache.delete(key);
        console.log(`[Cache Invalidation] Invalidated cache for ${changeType} - user ${userId}`);
        break;

      case 'subscription_expired':
        // For expired subscriptions, invalidate immediately to prevent stale premium access
        invalidated = cache.delete(key);
        console.log(`[Cache Invalidation] Invalidated cache for expired subscription - user ${userId}`);
        break;

      case 'tier_change':
        // For tier changes, invalidate to ensure correct entitlements
        invalidated = cache.delete(key);
        console.log(`[Cache Invalidation] Invalidated cache for tier change - user ${userId}`);
        break;

      default:
        console.warn(`[Cache Invalidation] Unknown change type: ${changeType}`);
        invalidated = cache.delete(key);
    }

    // Record invalidation metric
    if (invalidated) {
      await recordInvalidationMetric(userId, changeType);
    }

    return invalidated;

  } catch (error) {
    console.error('[Cache Invalidation] Error in subscription-aware invalidation:', error);
    // Fallback to basic invalidation on error
    const key = `${keyPrefix}${userId}`;
    return cache.delete(key);
  }
}

/**
 * Intelligent cache invalidation based on subscription expiry patterns
 */
export function invalidateWithIntelligentTTL(
  cache: Map<string, CacheEntry>
): number {
  let invalidatedCount = 0;
  const now = Date.now();
  const nearExpiryThreshold = 5 * 60 * 1000; // 5 minutes

  try {
    const entries = Array.from(cache.entries());
    for (const [key, entry] of entries) {
      let shouldInvalidate = false;

      // Standard expiry check
      if (entry.expiresAt <= now) {
        shouldInvalidate = true;
      }

      // Subscription expiry check
      if (entry.subscriptionExpiry) {
        const subscriptionExpiry = new Date(entry.subscriptionExpiry).getTime();
        if (subscriptionExpiry <= now) {
          shouldInvalidate = true;
        }
      }

      // Proactive invalidation for entries nearing subscription expiry
      if (!shouldInvalidate && entry.subscriptionExpiry) {
        const subscriptionExpiry = new Date(entry.subscriptionExpiry).getTime();
        const timeUntilExpiry = subscriptionExpiry - now;

        // If subscription expires soon and cache entry is old, invalidate proactively
        if (timeUntilExpiry <= nearExpiryThreshold && (now - entry.timestamp) > 60000) { // 1 minute old
          shouldInvalidate = true;
          console.log(`[Cache Invalidation] Proactive invalidation for near-expiry subscription: ${key}`);
        }
      }

      if (shouldInvalidate) {
        cache.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      console.log(`[Cache Invalidation] Intelligent invalidation removed ${invalidatedCount} entries`);
    }

    return invalidatedCount;
  } catch (error) {
    console.error('[Cache Invalidation] Error in intelligent invalidation:', error);
    return 0;
  }
}

/**
 * Record invalidation metrics for monitoring
 */
async function recordInvalidationMetric(
  userId: string,
  changeType: string
): Promise<void> {
  try {
    await supabase.rpc('record_subscription_metric', {
      p_metric_type: 'cache_invalidated',
      p_user_id: userId,
      p_metric_data: {
        invalidation_reason: changeType,
        timestamp: new Date().toISOString()
      },
      p_source: 'cache_invalidation'
    });
  } catch (error) {
    console.error('[Cache Invalidation] Error recording invalidation metric:', error);
    // Don't throw - metrics recording should not break invalidation
  }
}

/**
 * Cleanup expired cache entries (enhanced version)
 */
export function cleanupExpiredEntries(
  cache: Map<string, CacheEntry>
): number {
  // Use intelligent invalidation for better performance
  return invalidateWithIntelligentTTL(cache);
}
