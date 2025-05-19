import { supabase } from '../../supabase';
import { isClubMember } from '../auth';
import { getNominationById } from './nominations/retrieve';

/**
 * Book Nomination Likes API
 */

export interface Like {
  nomination_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Like a book nomination
 * @param userId User ID
 * @param nominationId Nomination ID
 * @returns The updated nomination with new like count
 */
export async function likeNomination(userId: string, nominationId: string) {
  try {
    // Get the nomination to check club membership
    const { data: nomination, error: nominationError } = await supabase
      .from('book_nominations')
      .select('club_id')
      .eq('id', nominationId)
      .single();

    if (nominationError) {
      console.error('Error fetching nomination:', nominationError);
      throw new Error('Failed to find nomination');
    }

    // Check if user is a member of the club
    if (!(await isClubMember(userId, nomination.club_id))) {
      throw new Error('You must be a member of the club to like nominations');
    }

    // Check if the user has already liked this nomination
    const { data: existingLike, error: checkError } = await supabase
      .from('book_likes')
      .select('nomination_id')
      .eq('nomination_id', nominationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing like:', checkError);
      throw new Error('Failed to check if you already liked this nomination');
    }

    // If the user has already liked this nomination, return without error
    if (existingLike) {
      return getNominationById(nominationId, userId);
    }

    // Otherwise, create a new like
    const { error: insertError } = await supabase
      .from('book_likes')
      .insert({
        nomination_id: nominationId,
        user_id: userId
      });

    if (insertError) {
      console.error('Error liking nomination:', insertError);
      throw new Error('Failed to like nomination');
    }

    // Return the updated nomination with new like count
    return getNominationById(nominationId, userId);
  } catch (error) {
    console.error('Unexpected error liking nomination:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to like nomination');
  }
}

/**
 * Unlike a book nomination
 * @param userId User ID
 * @param nominationId Nomination ID
 * @returns The updated nomination with new like count
 */
export async function unlikeNomination(userId: string, nominationId: string) {
  try {
    // Delete the like
    const { error: deleteError } = await supabase
      .from('book_likes')
      .delete()
      .eq('nomination_id', nominationId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error unliking nomination:', deleteError);
      throw new Error('Failed to unlike nomination');
    }

    // Return the updated nomination with new like count
    return getNominationById(nominationId, userId);
  } catch (error) {
    console.error('Unexpected error unliking nomination:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to unlike nomination');
  }
}

/**
 * Get all likes for a nomination
 * @param userId Current user ID
 * @param nominationId Nomination ID
 * @returns Array of likes with user details
 */
export async function getLikes(userId: string, nominationId: string) {
  try {
    // Get the nomination to check club membership
    const { data: nomination, error: nominationError } = await supabase
      .from('book_nominations')
      .select('club_id')
      .eq('id', nominationId)
      .single();

    if (nominationError) {
      console.error('Error fetching nomination:', nominationError);
      throw new Error('Failed to find nomination');
    }

    // Check if user is a member of the club
    if (!(await isClubMember(userId, nomination.club_id))) {
      throw new Error('You must be a member of the club to view likes');
    }

    // Get all likes for the nomination with user details
    const { data: likes, error } = await supabase
      .from('book_likes')
      .select(`
        nomination_id,
        user_id,
        created_at,
        user:users(id, username, avatar_url)
      `)
      .eq('nomination_id', nominationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching likes:', error);
      throw new Error('Failed to fetch likes');
    }

    return likes || [];
  } catch (error) {
    console.error('Unexpected error getting likes:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get likes');
  }
}

/**
 * Check if a user has liked a nomination
 * @param userId User ID
 * @param nominationId Nomination ID
 * @returns Boolean indicating if the user has liked the nomination
 */
export async function hasUserLikedNomination(userId: string, nominationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('book_likes')
      .select('nomination_id')
      .eq('nomination_id', nominationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking if user has liked nomination:', error);
      throw new Error('Failed to check like status');
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error checking like status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to check like status');
  }
}
