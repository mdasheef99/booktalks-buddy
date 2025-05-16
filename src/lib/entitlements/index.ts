/**
 * Entitlements Service
 *
 * This module provides functions for calculating and checking user entitlements
 * based on their roles in the system.
 */

import { supabase } from '../supabase';

/**
 * Basic entitlements that all authenticated users have
 */
export const BASIC_ENTITLEMENTS = [
  'CAN_VIEW_PUBLIC_CLUBS',
  'CAN_JOIN_PUBLIC_CLUBS',
  'CAN_PARTICIPATE_IN_DISCUSSIONS',
  'CAN_EDIT_OWN_PROFILE',
  'CAN_VIEW_STORE_EVENTS',
];

/**
 * Entitlements for privileged members
 */
export const PRIVILEGED_ENTITLEMENTS = [
  'CAN_ACCESS_PREMIUM_CONTENT',
  'CAN_JOIN_PREMIUM_CLUBS',
  'CAN_ACCESS_PREMIUM_EVENTS',
  'CAN_CREATE_CLUB',
];

/**
 * Entitlements for privileged plus members
 */
export const PRIVILEGED_PLUS_ENTITLEMENTS = [
  'CAN_JOIN_EXCLUSIVE_CLUBS',
  'CAN_ACCESS_EXCLUSIVE_CONTENT',
];

/**
 * Entitlements for club leads
 */
export const CLUB_LEAD_ENTITLEMENTS = [
  'CAN_MANAGE_CLUB_SETTINGS',
  'CAN_DELETE_OWN_CLUB',
  'CAN_SET_CLUB_CURRENT_BOOK',
  'CAN_MANAGE_CLUB_JOIN_REQUESTS',
  'CAN_REMOVE_CLUB_MEMBERS',
  'CAN_ASSIGN_CLUB_MODERATORS',
];

/**
 * Entitlements for club moderators
 */
export const CLUB_MODERATOR_ENTITLEMENTS = [
  'CAN_DELETE_CLUB_POSTS',
  'CAN_LOCK_CLUB_TOPICS',
  'CAN_ISSUE_MEMBER_WARNINGS',
];

/**
 * Entitlements for store managers
 */
export const STORE_MANAGER_ENTITLEMENTS = [
  'CAN_MANAGE_USER_TIERS',
  'CAN_MANAGE_ALL_CLUBS',
  'CAN_MANAGE_STORE_EVENTS',
  'CAN_VIEW_STORE_ANALYTICS',
  'CAN_ASSIGN_CLUB_LEADS',
];

/**
 * Entitlements for store owners
 */
export const STORE_OWNER_ENTITLEMENTS = [
  'CAN_MANAGE_STORE_MANAGERS',
  'CAN_MANAGE_STORE_SETTINGS',
  'CAN_MANAGE_STORE_BILLING',
];

/**
 * Entitlements for platform owner
 */
export const PLATFORM_OWNER_ENTITLEMENTS = [
  'CAN_CREATE_STORES',
  'CAN_DELETE_STORES',
  'CAN_ASSIGN_STORE_OWNERS',
  'CAN_VIEW_ALL_STORES',
  'CAN_MANAGE_PLATFORM_SETTINGS',
  'CAN_VIEW_PLATFORM_ANALYTICS',
];

/**
 * Calculate all entitlements for a user
 *
 * @param userId The user ID to calculate entitlements for
 * @returns An array of entitlement strings
 */
export async function calculateUserEntitlements(userId: string): Promise<string[]> {
  const entitlements: string[] = [...BASIC_ENTITLEMENTS];

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
        // Platform owner inherits all other role entitlements
        entitlements.push(...STORE_OWNER_ENTITLEMENTS);
        entitlements.push(...STORE_MANAGER_ENTITLEMENTS);
      }
    } catch (error) {
      // Silently handle the case where platform_settings table doesn't exist
      console.warn('Could not check platform owner status:', error);
    }

    // 2. Get user's account tier
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('account_tier')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 2. Add tier-based entitlements
    if (user?.account_tier === 'privileged' || user?.account_tier === 'privileged_plus') {
      entitlements.push(...PRIVILEGED_ENTITLEMENTS);
    }

    if (user?.account_tier === 'privileged_plus') {
      entitlements.push(...PRIVILEGED_PLUS_ENTITLEMENTS);
    }

    // 3. Check store administrator roles
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

    // 4. Check club leadership
    try {
      const { data: ledClubs, error: ledClubsError } = await supabase
        .from('book_clubs')
        .select('id')
        .eq('lead_user_id', userId);

      if (ledClubsError) throw ledClubsError;

      for (const club of ledClubs || []) {
        entitlements.push(`CLUB_LEAD_${club.id}`);
        entitlements.push(...CLUB_LEAD_ENTITLEMENTS);
      }
    } catch (error) {
      // Silently handle the case where book_clubs table doesn't exist or has no lead_user_id column
      console.warn('Could not check club leadership roles:', error);
    }

    // 5. Check club moderator roles
    try {
      const { data: moderatedClubs, error: moderatedClubsError } = await supabase
        .from('club_moderators')
        .select('club_id')
        .eq('user_id', userId);

      if (moderatedClubsError) throw moderatedClubsError;

      for (const club of moderatedClubs || []) {
        entitlements.push(`CLUB_MODERATOR_${club.club_id}`);
        entitlements.push(...CLUB_MODERATOR_ENTITLEMENTS);
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
 * Check if a user has a specific entitlement
 *
 * @param entitlements The user's entitlements array
 * @param entitlement The entitlement to check for
 * @returns True if the user has the entitlement, false otherwise
 */
export function hasEntitlement(entitlements: string[], entitlement: string): boolean {
  return entitlements.includes(entitlement);
}

/**
 * Check if a user has a contextual entitlement (e.g., CLUB_LEAD_123)
 *
 * @param entitlements The user's entitlements array
 * @param prefix The entitlement prefix (e.g., 'CLUB_LEAD')
 * @param contextId The context ID (e.g., the club ID)
 * @returns True if the user has the contextual entitlement, false otherwise
 */
export function hasContextualEntitlement(
  entitlements: string[],
  prefix: string,
  contextId: string
): boolean {
  return entitlements.includes(`${prefix}_${contextId}`);
}

/**
 * Check if a user can manage a club (as a lead, store admin, or moderator)
 *
 * @param entitlements The user's entitlements array
 * @param clubId The club ID
 * @param storeId The store ID that the club belongs to
 * @returns True if the user can manage the club, false otherwise
 */
export function canManageClub(
  entitlements: string[],
  clubId: string,
  storeId: string
): boolean {
  return (
    hasEntitlement(entitlements, 'CAN_MANAGE_ALL_CLUBS') ||
    hasContextualEntitlement(entitlements, 'CLUB_LEAD', clubId) ||
    hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
    hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId)
  );
}

/**
 * Check if a user can moderate a club (as a moderator, lead, or store admin)
 *
 * @param entitlements The user's entitlements array
 * @param clubId The club ID
 * @param storeId The store ID that the club belongs to
 * @returns True if the user can moderate the club, false otherwise
 */
export function canModerateClub(
  entitlements: string[],
  clubId: string,
  storeId: string
): boolean {
  return (
    canManageClub(entitlements, clubId, storeId) ||
    hasContextualEntitlement(entitlements, 'CLUB_MODERATOR', clubId)
  );
}

/**
 * Check if a user can manage store settings (as a store owner)
 *
 * @param entitlements The user's entitlements array
 * @param storeId The store ID
 * @returns True if the user can manage store settings, false otherwise
 */
export function canManageStore(
  entitlements: string[],
  storeId: string
): boolean {
  return (
    hasEntitlement(entitlements, 'CAN_MANAGE_STORE_SETTINGS') &&
    hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId)
  );
}

/**
 * Check if a user can manage user tiers (as a store owner or manager)
 *
 * @param entitlements The user's entitlements array
 * @param storeId The store ID
 * @returns True if the user can manage user tiers, false otherwise
 */
export function canManageUserTiers(
  entitlements: string[],
  storeId: string
): boolean {
  return (
    hasEntitlement(entitlements, 'CAN_MANAGE_USER_TIERS') && (
      hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
      hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId)
    )
  );
}

/**
 * Check if a user is the platform owner
 *
 * @param entitlements The user's entitlements array
 * @returns True if the user is the platform owner, false otherwise
 */
export function isPlatformOwner(entitlements: string[]): boolean {
  return hasEntitlement(entitlements, 'CAN_MANAGE_PLATFORM_SETTINGS');
}
