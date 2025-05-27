/**
 * Club Moderator Management API
 *
 * Functions for managing club moderators and their permissions.
 */

import { supabase } from '@/lib/supabase';
import { ClubModerator } from './types';

// =====================================================
// Moderator Management Functions
// =====================================================

/**
 * Get moderators for a club with user profile data
 */
export async function getClubModerators(clubId: string): Promise<ClubModerator[]> {
  try {
    console.log('Fetching moderators for club:', clubId);

    // First, try the join approach
    const { data, error } = await supabase
      .from('club_moderators')
      .select(`
        *,
        users!inner (
          username,
          email,
          displayname
        )
      `)
      .eq('club_id', clubId)
      .eq('is_active', true)
      .order('appointed_at', { ascending: false });

    if (error) {
      console.error('Supabase join error:', error);

      // Fallback: Fetch moderators without join, then fetch user data separately
      console.log('Attempting fallback approach...');
      return await getClubModeratorsWithFallback(clubId);
    }

    console.log('Successfully fetched moderators with join:', data?.length || 0);

    // Transform the data to match our expected structure
    const transformedData = data?.map(moderator => ({
      ...moderator,
      user: {
        username: moderator.users?.username || '',
        email: moderator.users?.email || '',
        display_name: moderator.users?.displayname || moderator.users?.username || ''
      }
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Error fetching club moderators:', error);

    // Final fallback
    console.log('Attempting final fallback...');
    return await getClubModeratorsWithFallback(clubId);
  }
}

/**
 * Fallback method: Fetch moderators and user data separately
 */
async function getClubModeratorsWithFallback(clubId: string): Promise<ClubModerator[]> {
  try {
    // Step 1: Get moderators without user data
    const { data: moderators, error: moderatorsError } = await supabase
      .from('club_moderators')
      .select('*')
      .eq('club_id', clubId)
      .eq('is_active', true)
      .order('appointed_at', { ascending: false });

    if (moderatorsError) {
      console.error('Error fetching moderators (fallback):', moderatorsError);
      throw moderatorsError;
    }

    if (!moderators || moderators.length === 0) {
      console.log('No moderators found for club:', clubId);
      return [];
    }

    console.log('Fetched moderators (fallback):', moderators.length);

    // Step 2: Get user data for all moderators
    const userIds = moderators.map(mod => mod.user_id);

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, displayname')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching user data (fallback):', usersError);
      // Continue without user data
    }

    console.log('Fetched user data (fallback):', users?.length || 0);

    // Step 3: Combine the data
    const enrichedModerators = moderators.map(moderator => {
      const user = users?.find(u => u.id === moderator.user_id);

      return {
        ...moderator,
        user: user ? {
          username: user.username || '',
          email: user.email || '',
          display_name: user.displayname || user.username || ''
        } : undefined
      };
    });

    return enrichedModerators;
  } catch (error) {
    console.error('Fallback method failed:', error);
    throw new Error('Failed to fetch club moderators');
  }
}

/**
 * Update moderator permissions
 */
export async function updateModeratorPermissions(
  clubId: string,
  moderatorId: string,
  permissions: Partial<Pick<ClubModerator,
    'analytics_access' |
    'meeting_management_access' |
    'customization_access' |
    'content_moderation_access' |
    'member_management_access'
  >>
): Promise<ClubModerator> {
  try {
    const { data, error } = await supabase
      .from('club_moderators')
      .update(permissions)
      .eq('id', moderatorId)
      .eq('club_id', clubId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating moderator permissions:', error);
    throw new Error('Failed to update moderator permissions');
  }
}

/**
 * Toggle moderator analytics access
 */
export async function toggleModeratorAnalytics(
  clubId: string,
  moderatorId: string,
  enabled: boolean
): Promise<void> {
  try {
    await updateModeratorPermissions(clubId, moderatorId, {
      analytics_access: enabled
    });
  } catch (error) {
    console.error('Error toggling moderator analytics access:', error);
    throw new Error('Failed to toggle moderator analytics access');
  }
}
