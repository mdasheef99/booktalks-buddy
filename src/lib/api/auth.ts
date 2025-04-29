import { supabase } from '../supabase';

/**
 * Authentication and authorization helper functions
 */

/**
 * Check if a user is an admin of a specific book club
 */
export async function isClubAdmin(userId: string, clubId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('club_members')
    .select('role')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .single();

  if (error || !data) return false;
  return data.role === 'admin';
}

/**
 * Check if a user is a member of a specific book club
 */
export async function isClubMember(userId: string, clubId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('club_members')
    .select('role')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .not('role', 'eq', 'pending')
    .single();

  return !!data && !error;
}
