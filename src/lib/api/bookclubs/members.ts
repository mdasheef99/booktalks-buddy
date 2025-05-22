import { supabase } from '../../supabase';
import { isClubAdmin, isClubMember } from '../auth';
import { invalidateUserEntitlements } from '@/lib/entitlements/cache';

/**
 * Book Club Membership Management
 */

/**
 * Join a book club
 */
export async function joinClub(userId: string, clubId: string) {
  // Check if already a member
  if (await isClubMember(userId, clubId)) throw new Error('Already a member');

  const { error } = await supabase.from('club_members').insert([{ user_id: userId, club_id: clubId, role: 'member' }]);
  if (error) throw error;
  return { success: true };
}

/**
 * Leave a book club
 */
export async function leaveClub(userId: string, clubId: string) {
  const { error } = await supabase.from('club_members').delete().eq('user_id', userId).eq('club_id', clubId);
  if (error) throw error;
  return { success: true };
}

/**
 * Get members of a club
 * @param clubId Club ID to get members for
 * @returns Array of club members with user details
 */
export async function getClubMembers(clubId: string) {
  try {
    // Get all members of this club (excluding pending requests)
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select('user_id, club_id, role, joined_at')
      .eq('club_id', clubId)
      .neq('role', 'pending')
      .order('joined_at', { ascending: false });

    if (membersError) {
      console.error('[getClubMembers] Error fetching members:', membersError);
      // Check for specific error types
      if (membersError.code === '42P01') { // Table doesn't exist
        console.warn('Club members table does not exist yet');
        return [];
      }
      throw membersError;
    }

    if (!members || members.length === 0) {
      return [];
    }

    // Get user details in a separate query
    const userIds = members.map(member => member.user_id);

    let users = [];
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, email')
        .in('id', userIds);

      if (usersError) {
        console.error('[getClubMembers] Error fetching user details:', usersError);
        // Continue with empty users array - we'll use default values
      } else {
        users = usersData || [];
      }
    } catch (error) {
      console.error('[getClubMembers] Exception fetching user details:', error);
      // Continue with empty users array
    }

    // Combine the data
    const enrichedMembers = members.map(member => {
      // Find the matching user or use a default object
      const user = users?.find(u => u.id === member.user_id) || null;

      // Create a default user object
      const userObj = {
        username: 'Unknown',
        email: '',
        display_name: 'Unknown User'
      };

      // Update with actual data if available
      if (user) {
        userObj.username = user.username || 'Unknown';
        userObj.email = user.email || '';
        // Since display_name might not exist, we'll use username as a fallback
        userObj.display_name = user.username || 'Unknown User';
      }

      return {
        user_id: member.user_id,
        club_id: member.club_id,
        role: member.role,
        joined_at: member.joined_at,
        user: userObj
      };
    });

    return enrichedMembers;
  } catch (error: any) {
    console.error('[getClubMembers] Error:', error);

    if (error.code === '42501') {
      throw new Error('You don\'t have permission to view club members');
    } else if (error.message) {
      throw new Error(`Failed to load club members: ${error.message}`);
    } else {
      throw new Error('Failed to load club members. Please try again later.');
    }
  }
}

/**
 * Add a member to a club (admin only)
 */
export async function addClubMember(adminId: string, clubId: string, userId: string, role: string = 'member') {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('club_members')
    .insert([{ user_id: userId, club_id: clubId, role }]);

  if (error) throw error;

  // If the role is 'admin', invalidate the user's entitlements cache
  if (role === 'admin') {
    invalidateUserEntitlements(userId);
  }

  return { success: true };
}

/**
 * Update a member's role (admin only)
 */
export async function updateMemberRole(adminId: string, clubId: string, userId: string, newRole: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('club_members')
    .update({ role: newRole })
    .eq('user_id', userId)
    .eq('club_id', clubId);

  if (error) throw error;

  // Invalidate the user's entitlements cache since their role has changed
  invalidateUserEntitlements(userId);

  // Also invalidate the admin's cache if they're different
  if (adminId !== userId) {
    invalidateUserEntitlements(adminId);
  }

  return { success: true };
}

/**
 * Remove a member from a club (admin only)
 * @param adminId ID of the admin removing the member
 * @param userIdToRemove ID of the user to remove
 * @param clubId ID of the club
 * @returns Success status
 */
export async function removeMember(adminId: string, userIdToRemove: string, clubId: string) {
  try {
    // Check if the admin has permission
    if (!(await isClubAdmin(adminId, clubId))) {
      throw new Error('You don\'t have permission to remove club members');
    }

    // First, check if the user is an admin of the club
    const { data: memberData, error: memberError } = await supabase
      .from('club_members')
      .select('role')
      .eq('user_id', userIdToRemove)
      .eq('club_id', clubId)
      .single();

    if (memberError) {
      if (memberError.code === 'PGRST116') { // No rows returned
        throw new Error('User is not a member of this club');
      }
      throw memberError;
    }

    const isAdmin = memberData?.role === 'admin';

    // Remove the member
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('user_id', userIdToRemove)
      .eq('club_id', clubId);

    if (error) throw error;

    // If the user was an admin, invalidate their entitlements cache
    if (isAdmin) {
      invalidateUserEntitlements(userIdToRemove);
    }

    return { success: true, message: 'Member removed successfully' };
  } catch (error: any) {
    console.error('[removeMember] Error:', error);

    if (error.code === '42501') {
      throw new Error('You don\'t have permission to remove club members');
    } else if (error.message) {
      throw new Error(`Failed to remove member: ${error.message}`);
    } else {
      throw new Error('Failed to remove member. Please try again later.');
    }
  }
}

/**
 * Invite a member to a club (admin only)
 * @param adminId ID of the admin sending the invite
 * @param clubId ID of the club
 * @param inviteeEmail Email of the user to invite
 * @returns Success status
 */
export async function inviteMember(adminId: string, clubId: string, inviteeEmail: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  // Implement invite logic (e.g., insert into invites table or send email)
  console.log(`Sending invite to ${inviteeEmail} for club ${clubId}`);

  // Placeholder implementation:
  return { success: true, message: `Invite sent to ${inviteeEmail} (placeholder)` };
}
