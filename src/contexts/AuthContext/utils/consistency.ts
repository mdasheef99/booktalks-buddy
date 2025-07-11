/**
 * Data Consistency Validation
 * 
 * This module handles validation of data consistency between
 * subscriptions and entitlements.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import type { User } from '@supabase/supabase-js';
import type { SubscriptionStatus } from '@/lib/api/subscriptions/types';

/**
 * Validate consistency between subscription status and entitlements
 * 
 * @param user - Current user
 * @param subscriptionStatus - Current subscription status
 * @param entitlements - Current entitlements
 * @returns boolean - True if data is consistent
 */
export function validateSubscriptionEntitlementsConsistency(
  user: User | null,
  subscriptionStatus: SubscriptionStatus | null,
  entitlements: string[]
): boolean {
  if (!user || !subscriptionStatus) return true;

  const currentTier = subscriptionStatus.currentTier;
  const hasActiveSubscription = subscriptionStatus.hasActiveSubscription;

  // Check for tier-specific entitlements
  const hasPrivilegedEntitlements = entitlements.some(e =>
    e.includes('CAN_CREATE_LIMITED_CLUBS') ||
    e.includes('CAN_ACCESS_PREMIUM_CONTENT')
  );

  const hasPrivilegedPlusEntitlements = entitlements.some(e =>
    e.includes('CAN_CREATE_UNLIMITED_CLUBS') ||
    e.includes('CAN_ACCESS_EXCLUSIVE_CONTENT')
  );

  // Validate consistency
  if (currentTier === 'PRIVILEGED' && hasActiveSubscription && !hasPrivilegedEntitlements) {
    console.warn(`[AuthContext] Inconsistency: User has PRIVILEGED subscription but missing privileged entitlements`);
    return false;
  }

  if (currentTier === 'PRIVILEGED_PLUS' && hasActiveSubscription && !hasPrivilegedPlusEntitlements) {
    console.warn(`[AuthContext] Inconsistency: User has PRIVILEGED_PLUS subscription but missing privileged plus entitlements`);
    return false;
  }

  if (!hasActiveSubscription && (hasPrivilegedEntitlements || hasPrivilegedPlusEntitlements)) {
    console.warn(`[AuthContext] Inconsistency: User has no active subscription but has premium entitlements`);
    return false;
  }

  return true;
}
