/**
 * Subscription-Aware Caching Module
 *
 * Implements subscription-specific caching logic, expiry-based invalidation,
 * and user-specific cache management. Extracted from cache.ts refactoring.
 *
 * Created: 2025-07-10
 * Part of: Phase 1A - cache.ts Refactoring
 */

import type { SubscriptionStatus } from '../types';
import { MIN_CACHE_TTL } from './types';

// =========================
// Subscription-Aware TTL Calculation
// =========================

/**
 * Calculate intelligent TTL based on subscription data
 */
export function calculateIntelligentTTL(
  data: SubscriptionStatus,
  baseTTL: number
): number {
  // If subscription has expiry date, don't cache beyond that
  if (data.subscriptionExpiry) {
    const subscriptionExpiry = new Date(data.subscriptionExpiry).getTime();
    const now = Date.now();
    const timeUntilExpiry = Math.floor((subscriptionExpiry - now) / 1000);

    if (timeUntilExpiry > 0 && timeUntilExpiry < baseTTL) {
      // Cache until subscription expires, but not less than minimum TTL
      return Math.max(timeUntilExpiry, MIN_CACHE_TTL);
    }
  }

  // For users without active subscriptions, use shorter TTL
  if (!data.hasActiveSubscription) {
    return Math.max(baseTTL / 2, MIN_CACHE_TTL);
  }

  return baseTTL;
}

/**
 * Check if subscription has expired
 */
export function isSubscriptionExpired(subscriptionExpiry: string | null): boolean {
  if (!subscriptionExpiry) {
    return false;
  }

  const expiryTime = new Date(subscriptionExpiry).getTime();
  const now = Date.now();

  return expiryTime <= now;
}

/**
 * Generate subscription-aware cache key
 */
export function generateSubscriptionAwareCacheKey(
  userId: string,
  keyPrefix: string,
  subscriptionExpiry?: string | null
): string {
  let key = `${keyPrefix}${userId}`;

  if (subscriptionExpiry) {
    // Include subscription expiry in key to ensure automatic invalidation
    const expiryHash = hashString(subscriptionExpiry);
    key += `:${expiryHash}`;
  }

  return key;
}

/**
 * Validate cache entry against subscription status
 */
export function validateCacheEntrySubscription(
  entry: { subscriptionExpiry: string | null; expiresAt: number },
  now: number = Date.now()
): { isValid: boolean; reason?: string } {
  // Check if cache entry is expired
  if (entry.expiresAt <= now) {
    return { isValid: false, reason: 'cache_expired' };
  }

  // Check if subscription has expired (even if cache entry hasn't)
  if (entry.subscriptionExpiry && isSubscriptionExpired(entry.subscriptionExpiry)) {
    return { isValid: false, reason: 'subscription_expired' };
  }

  return { isValid: true };
}

// =========================
// User-Specific Cache Management
// =========================

/**
 * Determine cache priority based on subscription tier
 */
export function getCachePriority(data: SubscriptionStatus): 'high' | 'medium' | 'low' {
  if (data.currentTier === 'PRIVILEGED_PLUS') {
    return 'high';
  } else if (data.currentTier === 'PRIVILEGED') {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Calculate cache warming priority for users
 */
export function calculateWarmingPriority(
  userIds: string[],
  subscriptionData: Map<string, SubscriptionStatus>
): string[] {
  return userIds.sort((a, b) => {
    const dataA = subscriptionData.get(a);
    const dataB = subscriptionData.get(b);

    if (!dataA && !dataB) return 0;
    if (!dataA) return 1;
    if (!dataB) return -1;

    const priorityA = getCachePriority(dataA);
    const priorityB = getCachePriority(dataB);

    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return priorityOrder[priorityB] - priorityOrder[priorityA];
  });
}

// =========================
// Helper Functions
// =========================

/**
 * Simple string hash function for cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
