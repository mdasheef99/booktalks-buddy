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
  PLATFORM_OWNER_ENTITLEMENTS
} from './constants';
import { hasEntitlement } from './permissions';

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

    // Use membership_tier column
    const membershipTier = user?.membership_tier || 'MEMBER';

    // Add tier-based entitlements
    if (membershipTier === 'PRIVILEGED' || membershipTier === 'PRIVILEGED_PLUS') {
      entitlements.push(...PRIVILEGED_ENTITLEMENTS);
    }

    if (membershipTier === 'PRIVILEGED_PLUS') {
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
