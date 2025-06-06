import { supabase } from '@/lib/supabase';
import { getNominationById } from './retrieve';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { canManageClub } from '@/lib/entitlements/permissions';

/**
 * Archive a nomination
 * @param userId User ID
 * @param nominationId Nomination ID
 * @returns The updated nomination
 */
export async function archiveNomination(userId: string, nominationId: string) {
  try {
    // Get the nomination to check permissions
    const { data: nomination, error: nominationError } = await supabase
      .from('book_nominations')
      .select('club_id, status')
      .eq('id', nominationId)
      .single();

    if (nominationError) {
      console.error('Error fetching nomination:', nominationError);
      throw new Error('Failed to find nomination');
    }

    // Get user entitlements and check club management permission
    const entitlements = await getUserEntitlements(userId);

    // Get club's store ID for contextual permission checking
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('store_id')
      .eq('id', nomination.club_id)
      .single();

    if (clubError) {
      console.error('Error fetching club store ID:', clubError);
      throw new Error('Failed to verify club permissions');
    }

    const canManage = canManageClub(entitlements, nomination.club_id, club.store_id);

    if (!canManage) {
      console.log('🚨 [archiveNomination] permission check failed for user:', userId);
      console.log('📍 Club ID:', nomination.club_id);
      console.log('🔑 User entitlements:', entitlements);
      throw new Error('Unauthorized: Only club administrators can archive nominations');
    }

    // Check if nomination is already archived
    if (nomination.status === 'archived') {
      throw new Error('This nomination is already archived');
    }

    // Update the nomination status to archived
    const { error: updateError } = await supabase
      .from('book_nominations')
      .update({ status: 'archived' })
      .eq('id', nominationId);

    if (updateError) {
      console.error('Error archiving nomination:', updateError);
      throw new Error('Failed to archive nomination');
    }

    // Return the updated nomination
    return getNominationById(nominationId, userId);
  } catch (error) {
    console.error('Unexpected error archiving nomination:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to archive nomination');
  }
}
