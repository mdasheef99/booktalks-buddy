/**
 * Subscription Management
 * 
 * This module handles subscription state management, validation,
 * and subscription-related helper functions.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import { validateUserSubscription } from '@/lib/api/subscriptions/validation';
import type { User } from '@supabase/supabase-js';
import type { SubscriptionStatus } from '@/lib/api/subscriptions/types';
import type { SubscriptionTier } from '../types';

/**
 * Refresh subscription status for a user
 * 
 * @param user - Current user
 * @param setSubscriptionStatus - Subscription status setter
 * @param setSubscriptionLoading - Loading state setter
 * @returns Promise<void>
 */
export async function refreshSubscriptionStatus(
  user: User | null,
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void,
  setSubscriptionLoading: (loading: boolean) => void
): Promise<void> {
  if (!user) {
    setSubscriptionStatus(null);
    setSubscriptionLoading(false);
    return;
  }

  try {
    setSubscriptionLoading(true);
    console.log(`[AuthContext] Refreshing subscription status for user ${user.id}`);

    // Use optimized subscription validation from Phase 4A.2.1
    const validationResult = await validateUserSubscription(user.id, {
      useCache: true,
      failSecure: true,
      timeout: 5000
    });

    if (validationResult.success) {
      setSubscriptionStatus(validationResult.status);
      console.log(`[AuthContext] Subscription status updated:`, {
        hasActiveSubscription: validationResult.status.hasActiveSubscription,
        currentTier: validationResult.status.currentTier,
        validationSource: validationResult.status.validationSource
      });
    } else {
      console.warn('[AuthContext] Subscription validation failed, using null status');
      setSubscriptionStatus(null);
    }

  } catch (error) {
    console.error('[AuthContext] Error refreshing subscription status:', error);
    setSubscriptionStatus(null);
  } finally {
    setSubscriptionLoading(false);
  }
}

/**
 * Check if user has valid subscription
 * 
 * @param subscriptionStatus - Current subscription status
 * @returns boolean - True if subscription is valid
 */
export function hasValidSubscription(subscriptionStatus: SubscriptionStatus | null): boolean {
  return subscriptionStatus?.hasActiveSubscription && subscriptionStatus?.isValid || false;
}

/**
 * Get user's subscription tier
 * 
 * @param subscriptionStatus - Current subscription status
 * @returns SubscriptionTier - User's subscription tier
 */
export function getSubscriptionTier(subscriptionStatus: SubscriptionStatus | null): SubscriptionTier {
  return subscriptionStatus?.currentTier || 'MEMBER';
}

/**
 * Check if user has required subscription tier
 * 
 * @param subscriptionStatus - Current subscription status
 * @param tier - Required tier
 * @returns boolean - True if user has required tier
 */
export function hasRequiredTier(
  subscriptionStatus: SubscriptionStatus | null,
  tier: 'PRIVILEGED' | 'PRIVILEGED_PLUS'
): boolean {
  const currentTier = getSubscriptionTier(subscriptionStatus);

  if (tier === 'PRIVILEGED') {
    return currentTier === 'PRIVILEGED' || currentTier === 'PRIVILEGED_PLUS';
  }

  if (tier === 'PRIVILEGED_PLUS') {
    return currentTier === 'PRIVILEGED_PLUS';
  }

  return false;
}

/**
 * Check if user can access a specific feature
 * 
 * @param entitlements - Current entitlements
 * @param subscriptionStatus - Current subscription status
 * @param feature - Feature to check
 * @returns boolean - True if user can access feature
 */
export function canAccessFeature(
  entitlements: string[],
  subscriptionStatus: SubscriptionStatus | null,
  feature: string
): boolean {
  // First check entitlements (authoritative)
  const hasEntitlementAccess = entitlements.includes(feature);

  // For premium features, also validate subscription
  const premiumFeatures = [
    'CAN_CREATE_LIMITED_CLUBS',
    'CAN_CREATE_UNLIMITED_CLUBS',
    'CAN_ACCESS_PREMIUM_CONTENT',
    'CAN_ACCESS_EXCLUSIVE_CONTENT',
    'CAN_JOIN_PREMIUM_CLUBS'
  ];

  if (premiumFeatures.includes(feature)) {
    // Premium feature requires both entitlement AND valid subscription
    return hasEntitlementAccess && hasValidSubscription(subscriptionStatus);
  }

  // Non-premium features only need entitlement
  return hasEntitlementAccess;
}

/**
 * Get subscription status with context
 * 
 * @param subscriptionStatus - Current subscription status
 * @returns Subscription status with context
 */
export function getSubscriptionStatusWithContext(subscriptionStatus: SubscriptionStatus | null) {
  if (!subscriptionStatus) {
    return {
      tier: 'MEMBER' as const,
      hasActiveSubscription: false,
      isValid: false,
      needsUpgrade: false,
      canUpgrade: true,
      context: 'No subscription data available'
    };
  }

  const needsUpgrade = !subscriptionStatus.hasActiveSubscription || !subscriptionStatus.isValid;

  return {
    tier: subscriptionStatus.currentTier,
    hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
    isValid: subscriptionStatus.isValid,
    needsUpgrade,
    canUpgrade: true,
    context: needsUpgrade ? 'Subscription required for premium features' : 'Subscription active',
    expiryDate: subscriptionStatus.subscriptionExpiry,
    lastValidated: subscriptionStatus.lastValidated
  };
}
