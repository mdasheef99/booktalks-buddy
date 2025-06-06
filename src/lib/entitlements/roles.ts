/**
 * Entitlements Roles
 *
 * This module contains user role management and role activity tracking.
 */

import { supabase } from '../supabase';
import { hasPermissionThroughRoleHierarchyAsync } from './permissions';
import { calculateUserEntitlements } from './membership';

/**
 * User role interface for role hierarchy checking
 */
export interface UserRole {
  role: string;
  contextId?: string;
  contextType?: 'platform' | 'store' | 'club';
}

/**
 * Get all roles for a user from the database
 *
 * @param userId The user ID to get roles for
 * @returns Promise<UserRole[]> Array of user roles
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const roles: UserRole[] = [];

  try {
    // 1. Check if user is platform owner
    try {
      const { data: platformOwner } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'platform_owner_id')
        .single();

      if (platformOwner?.value === userId) {
        roles.push({
          role: 'PLATFORM_OWNER',
          contextType: 'platform'
        });
      }
    } catch (error) {
      // Platform settings might not exist, continue
    }

    // 2. Get store administrator roles
    const { data: storeRoles } = await supabase
      .from('store_administrators')
      .select('store_id, role')
      .eq('user_id', userId);

    if (storeRoles) {
      for (const storeRole of storeRoles) {
        roles.push({
          role: storeRole.role === 'owner' ? 'STORE_OWNER' : 'STORE_MANAGER',
          contextId: storeRole.store_id,
          contextType: 'store'
        });
      }
    }

    // 3. Get club lead roles
    const { data: clubLeadRoles } = await supabase
      .from('book_clubs')
      .select('id')
      .eq('lead_user_id', userId)
      .is('deleted_at', null);

    if (clubLeadRoles) {
      for (const club of clubLeadRoles) {
        roles.push({
          role: 'CLUB_LEAD',
          contextId: club.id,
          contextType: 'club'
        });
      }
    }

    // 4. Get club moderator roles
    const { data: clubModeratorRoles } = await supabase
      .from('club_moderators')
      .select('club_id')
      .eq('user_id', userId);

    if (clubModeratorRoles) {
      for (const moderator of clubModeratorRoles) {
        // Only add if not already a club lead for this club
        const isAlreadyLead = roles.some(
          role => role.role === 'CLUB_LEAD' && role.contextId === moderator.club_id
        );

        if (!isAlreadyLead) {
          roles.push({
            role: 'CLUB_MODERATOR',
            contextId: moderator.club_id,
            contextType: 'club'
          });
        }
      }
    }

    // 5. Get membership tier as a role
    const { data: user } = await supabase
      .from('users')
      .select('membership_tier, account_tier')
      .eq('id', userId)
      .single();

    if (user) {
      const membershipTier = user.membership_tier ||
        (user.account_tier === 'free' ? 'MEMBER' :
         user.account_tier === 'privileged' ? 'PRIVILEGED' :
         user.account_tier === 'privileged_plus' ? 'PRIVILEGED_PLUS' : 'MEMBER');

      roles.push({
        role: membershipTier,
        contextType: 'platform'
      });
    }

  } catch (error) {
    console.error('Error getting user roles:', error);
  }

  return roles;
}

/**
 * Comprehensive permission checking function that uses role hierarchy
 *
 * @param userId The user ID to check permissions for
 * @param requiredEntitlement The entitlement to check for
 * @param contextId Optional context ID for contextual permissions
 * @returns Promise<boolean> True if the user has the permission
 */
export async function hasPermissionAdvanced(
  userId: string,
  requiredEntitlement: string,
  contextId?: string
): Promise<boolean> {
  try {
    // Get user's roles and entitlements
    const [userRoles, entitlements] = await Promise.all([
      getUserRoles(userId),
      calculateUserEntitlements(userId)
    ]);

    // Check direct entitlements first (fastest path)
    if (entitlements.includes(requiredEntitlement)) {
      return true;
    }

    // Check contextual entitlements
    if (contextId && entitlements.includes(`${requiredEntitlement}_${contextId}`)) {
      return true;
    }

    // Check through role hierarchy (async version for full context checking)
    return await hasPermissionThroughRoleHierarchyAsync(userRoles, requiredEntitlement, contextId);

  } catch (error) {
    console.error('Error checking advanced permissions:', error);
    return false;
  }
}

/**
 * Update role activity tracking
 *
 * @param userId The user ID
 * @param roleType The type of role being used
 * @param contextId Optional context ID
 * @param contextType Optional context type
 */
export async function trackRoleActivity(
  userId: string,
  roleType: string,
  contextId?: string,
  contextType?: 'platform' | 'store' | 'club'
): Promise<void> {
  try {
    await supabase.rpc('update_role_activity', {
      p_user_id: userId,
      p_role_type: roleType,
      p_context_id: contextId || '00000000-0000-0000-0000-000000000000',
      p_context_type: contextType
    });
  } catch (error) {
    console.error('Error tracking role activity:', error);
  }
}
