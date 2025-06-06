/**
 * Enhanced Membership Limit Enforcement
 *
 * This module provides context-aware validation for membership limits,
 * club creation/joining restrictions, and other tier-based limitations.
 *
 * Implements requirements from Phase 2 Task 3: Backend Enforcement Logic
 */

import { supabase } from '../../supabase';
import { getUserEntitlements } from '../cache';
import { hasEntitlement } from '../permissions';
import { canCreateClub, canJoinClub } from '../membership';
import { MembershipLimitConfig, EnforcementResult } from './types';

/**
 * Enhanced club creation limit enforcement with context validation
 */
export async function enforceClubCreationLimit(
  userId: string,
  storeId?: string
): Promise<EnforcementResult> {
  try {
    // Check basic club creation permission
    const canCreate = await canCreateClub(userId);

    if (!canCreate) {
      const entitlements = await getUserEntitlements(userId);

      // Determine specific reason for denial
      if (!hasEntitlement(entitlements, 'CAN_CREATE_LIMITED_CLUBS') &&
          !hasEntitlement(entitlements, 'CAN_CREATE_UNLIMITED_CLUBS')) {
        return {
          allowed: false,
          reason: 'Membership tier does not allow club creation. Upgrade to Privileged or higher.',
          statusCode: 403,
          data: { upgradeRequired: true, requiredTier: 'PRIVILEGED' }
        };
      }

      // Check if limit is reached for privileged users
      if (hasEntitlement(entitlements, 'CAN_CREATE_LIMITED_CLUBS')) {
        const { count } = await supabase
          .from('book_clubs')
          .select('*', { count: 'exact', head: true })
          .eq('lead_user_id', userId)
          .is('deleted_at', null);

        if ((count || 0) >= 3) {
          return {
            allowed: false,
            reason: 'Club creation limit reached (3 clubs). Upgrade to Privileged+ for unlimited clubs.',
            statusCode: 403,
            data: {
              currentCount: count,
              limit: 3,
              upgradeRequired: true,
              requiredTier: 'PRIVILEGED_PLUS'
            }
          };
        }
      }
    }

    // Additional context validation for store-specific clubs
    if (storeId) {
      // Check if user has permission to create clubs in this store
      const entitlements = await getUserEntitlements(userId);
      const canManageStore = hasEntitlement(entitlements, 'CAN_MANAGE_STORE_SETTINGS') ||
                            entitlements.includes(`STORE_OWNER_${storeId}`) ||
                            entitlements.includes(`STORE_MANAGER_${storeId}`);

      if (!canManageStore && !hasEntitlement(entitlements, 'CAN_CREATE_UNLIMITED_CLUBS')) {
        // For regular users, check if store allows public club creation
        const { data: store } = await supabase
          .from('stores')
          .select('allow_public_club_creation')
          .eq('id', storeId)
          .single();

        if (!store?.allow_public_club_creation) {
          return {
            allowed: false,
            reason: 'This store does not allow public club creation.',
            statusCode: 403,
            data: { storeRestriction: true }
          };
        }
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error enforcing club creation limit:', error);
    return {
      allowed: false,
      reason: 'Unable to verify club creation permissions.',
      statusCode: 500
    };
  }
}

/**
 * Enhanced club joining limit enforcement with context validation
 */
export async function enforceClubJoiningLimit(
  userId: string,
  clubId: string
): Promise<EnforcementResult> {
  try {
    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('club_members')
      .select('id')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .single();

    if (existingMembership) {
      return {
        allowed: false,
        reason: 'You are already a member of this club.',
        statusCode: 400,
        data: { alreadyMember: true }
      };
    }

    // Check basic club joining permission
    const canJoin = await canJoinClub(userId, clubId);

    if (!canJoin) {
      const entitlements = await getUserEntitlements(userId);

      // Check if it's a membership limit issue
      if (hasEntitlement(entitlements, 'CAN_JOIN_LIMITED_CLUBS')) {
        const { count } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if ((count || 0) >= 5) {
          return {
            allowed: false,
            reason: 'Club joining limit reached (5 clubs). Upgrade to Privileged for unlimited clubs.',
            statusCode: 403,
            data: {
              currentCount: count,
              limit: 5,
              upgradeRequired: true,
              requiredTier: 'PRIVILEGED'
            }
          };
        }
      }

      // Check if it's a premium club restriction
      const { data: club } = await supabase
        .from('book_clubs')
        .select('is_premium, is_exclusive')
        .eq('id', clubId)
        .single();

      if (club?.is_premium && !hasEntitlement(entitlements, 'CAN_JOIN_PREMIUM_CLUBS')) {
        return {
          allowed: false,
          reason: 'This is a premium club. Upgrade to Privileged to join premium clubs.',
          statusCode: 403,
          data: {
            premiumRequired: true,
            requiredTier: 'PRIVILEGED'
          }
        };
      }

      if (club?.is_exclusive && !hasEntitlement(entitlements, 'CAN_JOIN_EXCLUSIVE_CLUBS')) {
        return {
          allowed: false,
          reason: 'This is an exclusive club. Upgrade to Privileged+ to join exclusive clubs.',
          statusCode: 403,
          data: {
            exclusiveRequired: true,
            requiredTier: 'PRIVILEGED_PLUS'
          }
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error enforcing club joining limit:', error);
    return {
      allowed: false,
      reason: 'Unable to verify club joining permissions.',
      statusCode: 500
    };
  }
}

/**
 * Direct messaging limit enforcement
 *
 * @future-feature This function is ready for implementation when direct messaging is added
 * @status PLANNED - Direct messaging feature not yet implemented in application
 * @note Database column 'users.allow_direct_messages' is available and ready
 */
export async function enforceDirectMessagingLimit(
  userId: string,
  targetUserId: string
): Promise<EnforcementResult> {
  try {
    const entitlements = await getUserEntitlements(userId);

    if (!hasEntitlement(entitlements, 'CAN_SEND_DIRECT_MESSAGES')) {
      return {
        allowed: false,
        reason: 'Direct messaging requires Privileged+ membership.',
        statusCode: 403,
        data: {
          upgradeRequired: true,
          requiredTier: 'PRIVILEGED_PLUS'
        }
      };
    }

    // Check if target user allows direct messages
    const { data: targetUser } = await supabase
      .from('users')
      .select('allow_direct_messages, username')
      .eq('id', targetUserId)
      .single();

    if (targetUser && !targetUser.allow_direct_messages) {
      return {
        allowed: false,
        reason: `${targetUser.username || 'This user'} has disabled direct messages.`,
        statusCode: 403,
        data: { userRestriction: true, targetUsername: targetUser.username }
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error enforcing direct messaging limit:', error);
    return {
      allowed: false,
      reason: 'Unable to verify messaging permissions.',
      statusCode: 500
    };
  }
}

/**
 * Premium content access enforcement
 */
export async function enforcePremiumContentAccess(
  userId: string,
  contentType: 'premium' | 'exclusive'
): Promise<EnforcementResult> {
  try {
    const entitlements = await getUserEntitlements(userId);

    const requiredEntitlement = contentType === 'premium'
      ? 'CAN_ACCESS_PREMIUM_CONTENT'
      : 'CAN_ACCESS_EXCLUSIVE_CONTENT';

    const requiredTier = contentType === 'premium' ? 'PRIVILEGED' : 'PRIVILEGED_PLUS';

    if (!hasEntitlement(entitlements, requiredEntitlement)) {
      return {
        allowed: false,
        reason: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} content requires ${requiredTier} membership.`,
        statusCode: 403,
        data: {
          upgradeRequired: true,
          requiredTier,
          contentType
        }
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error enforcing premium content access:', error);
    return {
      allowed: false,
      reason: 'Unable to verify content access permissions.',
      statusCode: 500
    };
  }
}

/**
 * Generic membership limit enforcement
 */
export async function enforceMembershipLimit(
  config: MembershipLimitConfig
): Promise<EnforcementResult> {
  const { limitType, context } = config;

  if (!context?.userId) {
    return {
      allowed: false,
      reason: 'User ID required for membership limit check.',
      statusCode: 400
    };
  }

  switch (limitType) {
    case 'club_creation':
      return enforceClubCreationLimit(context.userId, context.storeId);

    case 'club_joining':
      if (!context.clubId) {
        return {
          allowed: false,
          reason: 'Club ID required for club joining limit check.',
          statusCode: 400
        };
      }
      return enforceClubJoiningLimit(context.userId, context.clubId);

    case 'direct_messages':
      // This would need a target user ID in a real implementation
      return {
        allowed: false,
        reason: 'Target user ID required for direct messaging limit check.',
        statusCode: 400
      };

    case 'premium_access':
      return enforcePremiumContentAccess(context.userId, 'premium');

    default:
      return {
        allowed: false,
        reason: 'Unknown limit type.',
        statusCode: 400
      };
  }
}
