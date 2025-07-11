/**
 * Club Roles Management
 * 
 * This module handles club membership roles and related functionality
 * including role fetching and role checking.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

/**
 * Fetch club roles for a user
 * 
 * @param user - Current user
 * @param setClubRoles - Club roles state setter
 * @returns Promise<void>
 */
export async function fetchClubRoles(
  user: User | null,
  setClubRoles: (roles: Record<string, string>) => void
): Promise<void> {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select('club_id, role')
      .eq('user_id', user.id)
      .not('role', 'eq', 'pending');

    if (error) {
      toast.error('Failed to load club membership data');
      return;
    }

    const rolesMap: Record<string, string> = {};
    data?.forEach((row: any) => {
      rolesMap[row.club_id] = row.role;
    });
    setClubRoles(rolesMap);
  } catch (err) {
    toast.error('Failed to load club membership data');
  }
}

/**
 * Check if user is admin of a specific club
 * 
 * @param clubRoles - Current club roles
 * @param clubId - Club ID to check
 * @returns boolean - True if user is admin
 */
export function isAdmin(clubRoles: Record<string, string>, clubId: string): boolean {
  return clubRoles[clubId] === 'admin';
}

/**
 * Check if user is member of a specific club
 * 
 * @param clubRoles - Current club roles
 * @param clubId - Club ID to check
 * @returns boolean - True if user is member
 */
export function isMember(clubRoles: Record<string, string>, clubId: string): boolean {
  return clubRoles.hasOwnProperty(clubId) && clubRoles[clubId] !== 'pending';
}
