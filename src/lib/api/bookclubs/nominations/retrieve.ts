import { supabase } from '@/lib/supabase';
import { isClubMember } from '@/lib/api/auth';
import { Nomination } from '../types';

/**
 * Get all nominations for a club
 * @param clubId Club ID
 * @param userId Current user ID (for checking if user has liked each nomination)
 * @param status Filter by nomination status (optional)
 * @returns Array of nominations with book details and like counts
 */
export async function getNominations(
  clubId: string,
  userId: string,
  status: 'active' | 'selected' | 'archived' | 'all' = 'active'
): Promise<Nomination[]> {
  try {
    // Check if user is a member of the club
    if (!(await isClubMember(userId, clubId))) {
      throw new Error('You must be a member of the club to view nominations');
    }

    // Build the query
    let query = supabase
      .from('book_nominations')
      .select(`
        id,
        club_id,
        book_id,
        nominated_by,
        status,
        nominated_at,
        book:books(id, google_books_id, title, author, cover_url, description, genre)
      `)
      .eq('club_id', clubId);

    // Apply status filter if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Execute the query
    const { data: nominations, error } = await query.order('nominated_at', { ascending: false });

    if (error) {
      console.error('Error fetching nominations:', error);
      throw new Error('Failed to fetch nominations');
    }

    if (!nominations || nominations.length === 0) {
      return [];
    }

    // Get like counts for each nomination
    const nominationIds = nominations.map(n => n.id);

    // Use a more reliable approach to get like counts
    const likeCountMap: Record<string, number> = {};

    // Initialize all nomination IDs with 0 likes
    nominationIds.forEach(id => {
      likeCountMap[id] = 0;
    });

    // Fetch all likes for these nominations
    const { data: allLikes, error: likesError } = await supabase
      .from('book_likes')
      .select('nomination_id')
      .in('nomination_id', nominationIds);

    if (likesError) {
      console.error('Error fetching likes:', likesError);
      // Continue with zero counts
    } else if (allLikes && allLikes.length > 0) {
      // Count likes for each nomination
      allLikes.forEach(like => {
        if (like.nomination_id in likeCountMap) {
          likeCountMap[like.nomination_id]++;
        }
      });
    }

    // Check which nominations the user has liked
    const { data: userLikes, error: userLikesError } = await supabase
      .from('book_likes')
      .select('nomination_id')
      .in('nomination_id', nominationIds)
      .eq('user_id', userId);

    if (userLikesError) {
      console.error('Error fetching user likes:', userLikesError);
      // Continue without user likes
    }

    // Create a set of nomination IDs the user has liked
    const userLikedSet = new Set(userLikes?.map(like => like.nomination_id) || []);

    // Combine all the data
    return nominations.map(nomination => ({
      id: nomination.id,
      club_id: nomination.club_id,
      book_id: nomination.book_id,
      nominated_by: nomination.nominated_by,
      status: nomination.status as 'active' | 'selected' | 'archived',
      nominated_at: nomination.nominated_at,
      book: nomination.book,
      like_count: likeCountMap[nomination.id] || 0,
      user_has_liked: userLikedSet.has(nomination.id)
    }));
  } catch (error) {
    console.error('Unexpected error getting nominations:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get nominations');
  }
}

/**
 * Get a specific nomination by ID
 * @param nominationId Nomination ID
 * @param userId Current user ID (for checking if user has liked the nomination)
 * @returns Nomination with book details and like count
 */
export async function getNominationById(nominationId: string, userId: string): Promise<Nomination> {
  try {
    // Get the nomination with book details
    const { data: nomination, error } = await supabase
      .from('book_nominations')
      .select(`
        id,
        club_id,
        book_id,
        nominated_by,
        status,
        nominated_at,
        book:books(id, google_books_id, title, author, cover_url, description, genre)
      `)
      .eq('id', nominationId)
      .single();

    if (error) {
      console.error('Error fetching nomination:', error);
      throw new Error('Failed to fetch nomination');
    }

    // Check if user is a member of the club
    if (!(await isClubMember(userId, nomination.club_id))) {
      throw new Error('You must be a member of the club to view nominations');
    }

    // Get like count
    const { data: likes, error: likeCountError } = await supabase
      .from('book_likes')
      .select('nomination_id') // Select a column that exists
      .eq('nomination_id', nominationId);

    if (likeCountError) {
      console.error('Error fetching like count:', likeCountError);
      // Continue without like count
    }

    // Count the number of likes
    const likeCount = likes ? likes.length : 0;

    // Check if user has liked this nomination
    const { data: userLike, error: userLikeError } = await supabase
      .from('book_likes')
      .select('nomination_id, user_id') // Select columns that exist
      .eq('nomination_id', nominationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (userLikeError) {
      console.error('Error checking if user has liked:', userLikeError);
      // Continue without user like status
    }

    return {
      id: nomination.id,
      club_id: nomination.club_id,
      book_id: nomination.book_id,
      nominated_by: nomination.nominated_by,
      status: nomination.status as 'active' | 'selected' | 'archived',
      nominated_at: nomination.nominated_at,
      book: nomination.book,
      like_count: likeCount || 0,
      user_has_liked: !!userLike
    };
  } catch (error) {
    console.error('Unexpected error getting nomination:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get nomination');
  }
}
