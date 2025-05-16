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
 */
export async function getClubMembers(clubId: string) {
  const { data, error } = await supabase
    .from('club_members')
    .select('*')
    .eq('club_id', clubId);

  if (error) throw error;
  return data;
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
 */
export async function removeMember(adminId: string, userIdToRemove: string, clubId: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  // First, check if the user is an admin of the club
  const { data: memberData, error: memberError } = await supabase
    .from('club_members')
    .select('role')
    .eq('user_id', userIdToRemove)
    .eq('club_id', clubId)
    .single();

  if (memberError && memberError.code !== 'PGRST116') throw memberError;

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

  return { success: true };
}

/**
 * Invite a member to a club (admin only)
 */
export async function inviteMember(adminId: string, clubId: string, inviteeEmail: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  // Implement invite logic (e.g., insert into invites table or send email)
  // Placeholder implementation:
  return { success: true, message: 'Invite sent (placeholder)' };
}
