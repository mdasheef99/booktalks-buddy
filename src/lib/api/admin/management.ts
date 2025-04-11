import { supabase } from '../../supabase';
import { isClubAdmin } from '../auth';

/**
 * Admin Management Functions
 */

/**
 * List all members for admin view
 */
export async function listAdminMembers(userId: string) {
  // Check if user is a global admin (assumed via Auth metadata or separate check)
  // For now, assume all authenticated users can list members (adjust as needed)
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
}

/**
 * Remove a member from a club (admin only)
 * Note: This is duplicated in bookclubs/members.ts for organizational purposes
 */
export async function removeMember(adminId: string, userIdToRemove: string, clubId: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('user_id', userIdToRemove)
    .eq('club_id', clubId);

  if (error) throw error;
  return { success: true };
}

/**
 * Invite a member to a club (admin only)
 * Note: This is duplicated in bookclubs/members.ts for organizational purposes
 */
export async function inviteMember(adminId: string, clubId: string, inviteeEmail: string) {
  if (!(await isClubAdmin(adminId, clubId))) throw new Error('Unauthorized');

  // Implement invite logic (e.g., insert into invites table or send email)
  // Placeholder implementation:
  return { success: true, message: 'Invite sent (placeholder)' };
}
