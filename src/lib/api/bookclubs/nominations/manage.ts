import { supabase } from '@/lib/supabase';
import { isClubAdmin } from '@/lib/api/auth';
import { getNominationById } from './retrieve';

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

    // Check if user is an admin of the club
    if (!(await isClubAdmin(userId, nomination.club_id))) {
      throw new Error('You must be an admin of the club to archive nominations');
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
