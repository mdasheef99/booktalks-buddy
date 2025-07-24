/**
 * Coordinated Data Refresh
 * 
 * This module handles coordinated refreshing of subscription
 * and entitlements data with consistency validation.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import { validateSubscriptionEntitlementsConsistency } from './consistency';
import type { User } from '@supabase/supabase-js';
import type { SubscriptionStatus } from '@/lib/api/subscriptions/types';

/**
 * Refresh subscription, entitlements, and account status data in parallel
 *
 * @param user - Current user
 * @param refreshSubscriptionStatus - Subscription refresh function
 * @param refreshEntitlements - Entitlements refresh function
 * @param refreshAccountStatus - Account status refresh function
 * @param subscriptionStatus - Current subscription status (for consistency check)
 * @param entitlements - Current entitlements (for consistency check)
 * @returns Promise<void>
 */
export async function refreshUserData(
  user: User | null,
  refreshSubscriptionStatus: () => Promise<void>,
  refreshEntitlements: () => Promise<void>,
  refreshAccountStatus: () => Promise<void>,
  subscriptionStatus: SubscriptionStatus | null,
  entitlements: string[]
): Promise<void> {
  if (!user) return;

  console.log(`[AuthContext] Refreshing coordinated user data for ${user.id}`);

  // Refresh subscription, entitlements, and account status in parallel for better performance
  const results = await Promise.allSettled([
    refreshSubscriptionStatus(),
    refreshEntitlements(),
    refreshAccountStatus()
  ]);

  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const sources = ['subscription', 'entitlements', 'account status'];
      const source = sources[index] || 'unknown';
      console.error(`[AuthContext] Failed to refresh ${source}:`, result.reason);
    }
  });

  // Validate consistency after refresh
  setTimeout(() => {
    const isConsistent = validateSubscriptionEntitlementsConsistency(user, subscriptionStatus, entitlements);
    if (!isConsistent) {
      console.warn('[AuthContext] Subscription-entitlements inconsistency detected after refresh');
    }
  }, 100); // Small delay to ensure state updates are complete

  console.log('[AuthContext] Coordinated user data refresh completed');
}
