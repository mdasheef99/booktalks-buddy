/**
 * Cache Management Utilities
 * 
 * This module handles cache invalidation and management for
 * authentication-related data.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import { invalidateUserEntitlements } from '@/lib/entitlements/cache';
import { invalidateOnSubscriptionEvent } from '@/lib/api/subscriptions/cache';

/**
 * Invalidate all user-related caches
 * 
 * @param userId - User ID to invalidate caches for
 * @returns Promise<void>
 */
export async function invalidateUserCaches(userId: string): Promise<void> {
  try {
    // Invalidate entitlements cache
    invalidateUserEntitlements(userId);

    // Invalidate subscription cache
    await invalidateOnSubscriptionEvent(userId, 'subscription_expired');
  } catch (error) {
    console.warn('[Cache Management] Failed to invalidate some caches:', error);
    // Non-critical error - continue operation
  }
}

/**
 * Invalidate entitlements cache for a user
 * 
 * @param userId - User ID to invalidate cache for
 */
export function invalidateEntitlementsCache(userId: string): void {
  invalidateUserEntitlements(userId);
}

/**
 * Invalidate subscription cache for a user
 * 
 * @param userId - User ID to invalidate cache for
 * @returns Promise<void>
 */
export async function invalidateSubscriptionCache(userId: string): Promise<void> {
  try {
    await invalidateOnSubscriptionEvent(userId, 'subscription_expired');
  } catch (error) {
    console.warn('[Cache Management] Failed to invalidate subscription cache:', error);
  }
}
