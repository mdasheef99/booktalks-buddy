/**
 * User Role Detection and Processing
 * 
 * This module handles detection and processing of user roles
 * that require subscription validation.
 * 
 * Part of: Role Classification System Refactoring
 * Created: 2025-01-11
 */

import { supabase } from '../../../supabase';
import type { UserRole } from '../types';

/**
 * Checks if a user has any user roles that require subscription validation
 * 
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user has roles requiring validation
 */
export async function hasUserRolesRequiringValidation(userId: string): Promise<boolean> {
  try {
    // Check club leadership
    const { data: ledClubs, error: clubError } = await supabase
      .from('book_clubs')
      .select('id')
      .eq('lead_user_id', userId);

    if (clubError) {
      console.warn('[Role Classification] Error checking club leadership:', clubError);
    }

    const hasClubLeadership = (ledClubs?.length || 0) > 0;

    // Check club moderator roles
    const { data: moderatedClubs, error: modError } = await supabase
      .from('club_moderators')
      .select('club_id')
      .eq('user_id', userId);

    if (modError) {
      console.warn('[Role Classification] Error checking club moderation:', modError);
    }

    const hasClubModeration = (moderatedClubs?.length || 0) > 0;

    return hasClubLeadership || hasClubModeration;

  } catch (error) {
    console.error('[Role Classification] Error checking user roles:', error);
    return false; // Fail secure - no enforcement if error
  }
}

/**
 * Processes user roles for a user and returns structured data
 * 
 * @param userId - User ID to process roles for
 * @returns Promise<UserRole[]> - Array of user roles
 */
export async function processUserRoles(userId: string): Promise<UserRole[]> {
  const userRoles: UserRole[] = [];

  try {
    // Check club leadership
    const { data: ledClubs } = await supabase
      .from('book_clubs')
      .select('id, created_at')
      .eq('lead_user_id', userId);

    for (const club of ledClubs || []) {
      userRoles.push({
        type: 'CLUB_LEADERSHIP',
        clubId: club.id,
        grantedAt: club.created_at || new Date().toISOString(),
        requiresSubscription: true
      });
    }

    // Check club moderator roles
    const { data: moderatedClubs } = await supabase
      .from('club_moderators')
      .select('club_id, assigned_at')
      .eq('user_id', userId);

    for (const modClub of moderatedClubs || []) {
      userRoles.push({
        type: 'CLUB_MODERATOR',
        clubId: modClub.club_id,
        grantedAt: modClub.assigned_at || new Date().toISOString(),
        requiresSubscription: true
      });
    }

    return userRoles;

  } catch (error) {
    console.error('[User Roles] Error processing user roles:', error);
    return []; // Return empty array on error
  }
}
