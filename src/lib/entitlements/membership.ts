/**
 * Entitlements Membership
 *
 * This module contains membership tier logic and club limits.
 */

import { supabase } from '../supabase';
import {
  MEMBER_ENTITLEMENTS,
  BASIC_ENTITLEMENTS,
  PRIVILEGED_ENTITLEMENTS,
  PRIVILEGED_PLUS_ENTITLEMENTS,
  CLUB_LEAD_ENTITLEMENTS,
  CLUB_MODERATOR_ENTITLEMENTS,
  STORE_MANAGER_ENTITLEMENTS,
  STORE_OWNER_ENTITLEMENTS,
  PLATFORM_OWNER_ENTITLEMENTS,
  ENTITLEMENT_FEATURE_FLAGS
} from './constants';
import { hasEntitlement } from './permissions';
import { isFeatureEnabled } from '../feature-flags';
import {
  hasActiveSubscription,
  getSubscriptionStatus
} from '../api/subscriptions';
import {
  makeSubscriptionValidationDecision,
  logRoleClassificationDecision,
  type SubscriptionValidationDecision
} from './roleClassification';

/**
 * Calculate all entitlements for a user
 *
 * @param userId The user ID to calculate entitlements for
 * @returns An array of entitlement strings
 */
export async function calculateUserEntitlements(userId: string): Promise<string[]> {
  const entitlements: string[] = [...MEMBER_ENTITLEMENTS];

  try {
    // 1. Check if user is platform owner
    try {
      const { data: platformOwner } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'platform_owner_id')
        .single();

      if (platformOwner?.value === userId) {
        entitlements.push(...PLATFORM_OWNER_ENTITLEMENTS);
        return [...new Set(entitlements)]; // Platform owner gets all permissions
      }
    } catch (error) {
      // Silently handle the case where platform_settings table doesn't exist
      console.warn('Could not check platform owner status:', error);
    }

    // 2. Get user's membership tier
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('membership_tier')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 3. Check if subscription validation feature flag is enabled
    const subscriptionValidationEnabled = await isFeatureEnabled(
      ENTITLEMENT_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION,
      { userId }
    );

    let membershipTier: string;

    if (subscriptionValidationEnabled.enabled) {
      // SECURITY FIX: Use subscription-validated tier instead of cached database tier
      console.log(`[Security] Subscription validation enabled for user ${userId}`);

      try {
        // Get validated subscription status
        const subscriptionStatus = await getSubscriptionStatus(userId, { useCache: true });

        // Use subscription-validated tier
        membershipTier = subscriptionStatus.currentTier;

        // Log security validation
        console.log(`[Security] User ${userId} tier validation:`, {
          databaseTier: user?.membership_tier || 'MEMBER',
          subscriptionTier: membershipTier,
          hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
          isValid: subscriptionStatus.isValid,
          validationSource: subscriptionStatus.validationSource
        });

        // Security warning if database and subscription tiers don't match
        if (user?.membership_tier && user.membership_tier !== membershipTier) {
          console.warn(`[Security] Tier mismatch detected for user ${userId}:`, {
            databaseTier: user.membership_tier,
            validatedTier: membershipTier,
            subscriptionValid: subscriptionStatus.isValid
          });
        }

      } catch (subscriptionError) {
        // Fail secure: Use MEMBER tier if subscription validation fails
        console.error(`[Security] Subscription validation failed for user ${userId}:`, subscriptionError);
        membershipTier = 'MEMBER';
      }
    } else {
      // Legacy behavior: Use cached database tier (VULNERABLE - Original Line 58 issue, now Line 108)
      membershipTier = user?.membership_tier || 'MEMBER';
      console.log(`[Legacy] Using database tier for user ${userId}: ${membershipTier}`);
    }

    // Add tier-based entitlements
    if (membershipTier === 'PRIVILEGED' || membershipTier === 'PRIVILEGED_PLUS') {
      entitlements.push(...PRIVILEGED_ENTITLEMENTS);
    }

    if (membershipTier === 'PRIVILEGED_PLUS') {
      entitlements.push(...PRIVILEGED_PLUS_ENTITLEMENTS);
    }

    // 4. Role-Based Subscription Enforcement (Phase 3.2)
    // IMPORTANT: Check exemptions FIRST before processing any roles
    let roleValidationDecision: SubscriptionValidationDecision | null = null;
    let roleEnforcementEnabled = false;
    let isExemptFromValidation = false;

    try {
      // Check if role-based subscription enforcement is enabled
      const roleEnforcementFlag = await isFeatureEnabled(
        'role_based_subscription_enforcement',
        { userId }
      );
      roleEnforcementEnabled = roleEnforcementFlag.enabled;

      if (roleEnforcementEnabled) {
        console.log(`[Role Enforcement] Role-based subscription enforcement enabled for user ${userId}`);

        // Get role-based subscription validation decision FIRST
        roleValidationDecision = await makeSubscriptionValidationDecision(userId);

        // Determine if user is exempt from validation (store owners, platform owners, etc.)
        isExemptFromValidation = !roleValidationDecision.shouldValidate;

        // Log the decision for monitoring
        logRoleClassificationDecision(userId, roleValidationDecision, 'calculateUserEntitlements');

        console.log(`[Role Enforcement] Validation decision for user ${userId}:`, {
          shouldValidate: roleValidationDecision.shouldValidate,
          isExempt: isExemptFromValidation,
          reason: roleValidationDecision.reason,
          exemptRoles: roleValidationDecision.exemptRoles.length,
          enforcedRoles: roleValidationDecision.enforcedRoles.length
        });
      } else {
        console.log(`[Role Enforcement] Role-based subscription enforcement disabled for user ${userId}`);
        // If enforcement is disabled, treat all users as exempt
        isExemptFromValidation = true;
      }
    } catch (error) {
      console.error(`[Role Enforcement] Error checking role enforcement for user ${userId}:`, error);
      // Fail secure: disable enforcement on error and treat as exempt
      roleEnforcementEnabled = false;
      roleValidationDecision = null;
      isExemptFromValidation = true;
    }

    // 5. Check store administrator roles
    try {
      const { data: storeRoles, error: storeError } = await supabase
        .from('store_administrators')
        .select('store_id, role')
        .eq('user_id', userId);

      if (storeError) throw storeError;

      for (const storeRole of storeRoles || []) {
        entitlements.push(`STORE_${storeRole.role.toUpperCase()}_${storeRole.store_id}`);

        if (storeRole.role === 'manager') {
          entitlements.push(...STORE_MANAGER_ENTITLEMENTS);
        }

        if (storeRole.role === 'owner') {
          entitlements.push(...STORE_MANAGER_ENTITLEMENTS);
          entitlements.push(...STORE_OWNER_ENTITLEMENTS);
        }
      }
    } catch (error) {
      // Silently handle the case where store_administrators table doesn't exist
      console.warn('Could not check store administrator roles:', error);
    }

    // 6. Check club leadership (with subscription enforcement)
    try {
      const { data: ledClubs, error: ledClubsError } = await supabase
        .from('book_clubs')
        .select('id')
        .eq('lead_user_id', userId);

      if (ledClubsError) throw ledClubsError;

      for (const club of ledClubs || []) {
        entitlements.push(`CLUB_LEAD_${club.id}`);

        // Apply role-based subscription enforcement for club leadership
        // Use the pre-calculated exemption status to ensure store owners bypass validation
        if (roleEnforcementEnabled && !isExemptFromValidation) {
          // User is subject to subscription validation for club leadership role
          const hasActiveSubscriptionForRole = await hasActiveSubscription(userId);

          if (hasActiveSubscriptionForRole) {
            console.log(`[Role Enforcement] User ${userId} has active subscription - granting club leadership entitlements`);
            entitlements.push(...CLUB_LEAD_ENTITLEMENTS);
          } else {
            console.log(`[Role Enforcement] User ${userId} lacks active subscription - denying club leadership entitlements`);
            // Note: Club-specific entitlement (CLUB_LEAD_${club.id}) is still granted for basic club access
            // but premium leadership entitlements are denied
          }
        } else {
          // Role enforcement disabled OR user is exempt (store owners, platform owners, etc.) - grant all entitlements
          const exemptionReason = isExemptFromValidation ? 'administrative exemption' : 'enforcement disabled';
          console.log(`[Role Enforcement] Granting club leadership entitlements without validation for user ${userId} (${exemptionReason})`);
          entitlements.push(...CLUB_LEAD_ENTITLEMENTS);
        }
      }
    } catch (error) {
      // Silently handle the case where book_clubs table doesn't exist or has no lead_user_id column
      console.warn('Could not check club leadership roles:', error);
    }

    // 7. Check club moderator roles (with subscription enforcement)
    try {
      const { data: moderatedClubs, error: moderatedClubsError } = await supabase
        .from('club_moderators')
        .select('club_id')
        .eq('user_id', userId);

      if (moderatedClubsError) throw moderatedClubsError;

      for (const club of moderatedClubs || []) {
        entitlements.push(`CLUB_MODERATOR_${club.club_id}`);

        // Apply role-based subscription enforcement for club moderation
        // Use the pre-calculated exemption status to ensure store owners bypass validation
        if (roleEnforcementEnabled && !isExemptFromValidation) {
          // User is subject to subscription validation for club moderator role
          const hasActiveSubscriptionForRole = await hasActiveSubscription(userId);

          if (hasActiveSubscriptionForRole) {
            console.log(`[Role Enforcement] User ${userId} has active subscription - granting club moderator entitlements`);
            entitlements.push(...CLUB_MODERATOR_ENTITLEMENTS);
          } else {
            console.log(`[Role Enforcement] User ${userId} lacks active subscription - denying club moderator entitlements`);
            // Note: Club-specific entitlement (CLUB_MODERATOR_${club.club_id}) is still granted for basic club access
            // but premium moderation entitlements are denied
          }
        } else {
          // Role enforcement disabled OR user is exempt (store owners, platform owners, etc.) - grant all entitlements
          const exemptionReason = isExemptFromValidation ? 'administrative exemption' : 'enforcement disabled';
          console.log(`[Role Enforcement] Granting club moderator entitlements without validation for user ${userId} (${exemptionReason})`);
          entitlements.push(...CLUB_MODERATOR_ENTITLEMENTS);
        }
      }
    } catch (error) {
      // Silently handle the case where club_moderators table doesn't exist
      console.warn('Could not check club moderator roles:', error);
    }

    // Remove duplicates
    return [...new Set(entitlements)];
  } catch (error) {
    console.error('Error calculating user entitlements:', error);
    return BASIC_ENTITLEMENTS;
  }
}

/**
 * Check if a user can create a club based on their membership tier and current club count
 *
 * @param userId The user ID to check
 * @returns Promise<boolean> True if the user can create a club, false otherwise
 */
export async function canCreateClub(userId: string): Promise<boolean> {
  const entitlements = await calculateUserEntitlements(userId);

  if (hasEntitlement(entitlements, 'CAN_CREATE_UNLIMITED_CLUBS')) {
    return true;
  }

  if (hasEntitlement(entitlements, 'CAN_CREATE_LIMITED_CLUBS')) {
    // Check current club count for PRIVILEGED users (limit: 3)
    try {
      const { count } = await supabase
        .from('book_clubs')
        .select('*', { count: 'exact', head: true })
        .eq('lead_user_id', userId)
        .is('deleted_at', null);

      return (count || 0) < 3;
    } catch (error) {
      console.error('Error checking club count:', error);
      return false;
    }
  }

  return false;
}

/**
 * Check if a user can join a club based on their membership tier and current joined club count
 *
 * @param userId The user ID to check
 * @param clubId The club ID they want to join
 * @returns Promise<boolean> True if the user can join the club, false otherwise
 */
export async function canJoinClub(userId: string, clubId: string): Promise<boolean> {
  const entitlements = await calculateUserEntitlements(userId);

  if (hasEntitlement(entitlements, 'CAN_JOIN_UNLIMITED_CLUBS')) {
    return true;
  }

  if (hasEntitlement(entitlements, 'CAN_JOIN_LIMITED_CLUBS')) {
    // Check current joined club count for MEMBER users (limit: 5)
    try {
      const { count } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // For Phase 2: We'll also check if user is already a member of this specific club
      // For now, just check the count limit
      console.log(`Checking join eligibility for user ${userId} to club ${clubId}`);
      return (count || 0) < 5;
    } catch (error) {
      console.error('Error checking joined club count:', error);
      return false;
    }
  }

  return false;
}
