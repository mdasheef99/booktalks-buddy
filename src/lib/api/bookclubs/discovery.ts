import { supabase } from '../../supabase';

/**
 * Get discoverable book clubs with pagination
 * @param userId Current user ID
 * @param options Pagination and filter options
 * @returns Paginated list of discoverable clubs with user's status for each
 */
export async function getDiscoverableClubs(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    filter?: 'all' | 'public' | 'private';
    search?: string;
  } = {}
) {
  const {
    limit = 10,
    offset = 0,
    filter = 'all',
    search = ''
  } = options;

  console.log(`[getDiscoverableClubs] Called with userId: ${userId}, limit: ${limit}, offset: ${offset}, filter: ${filter}, search: ${search}`);

  try {
    // Build the query for clubs
    let query = supabase
      .from('book_clubs')
      .select('*', { count: 'exact' });

    // Apply privacy filter if specified
    if (filter === 'public') {
      query = query.eq('privacy', 'public');
    } else if (filter === 'private') {
      query = query.eq('privacy', 'private');
    }

    // Apply search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    // Execute the query
    const { data: clubs, error, count } = await query;

    if (error) throw error;

    // If no clubs found, return empty result
    if (!clubs || clubs.length === 0) {
      return { clubs: [], count: 0 };
    }

    // Get the user's membership status for each club
    const clubIds = clubs.map(club => club.id);
    const { data: memberships, error: membershipError } = await supabase
      .from('club_members')
      .select('club_id, role')
      .eq('user_id', userId)
      .in('club_id', clubIds);

    if (membershipError) throw membershipError;

    // Create a map of club_id to membership status
    const membershipMap: Record<string, string> = {};
    memberships?.forEach(membership => {
      membershipMap[membership.club_id] = membership.role;
    });

    // Enhance clubs with user status
    const enhancedClubs = clubs.map(club => {
      const userStatus = membershipMap[club.id] || 'not-member';
      return {
        ...club,
        user_status: userStatus
      };
    });

    return {
      clubs: enhancedClubs,
      count: count || enhancedClubs.length
    };
  } catch (error) {
    console.error('[getDiscoverableClubs] Error:', error);
    throw error;
  }
}

/**
 * Join a public club or request to join a private club
 * @param userId Current user ID
 * @param clubId Club ID to join
 * @returns Success status and message
 */
export async function joinOrRequestClub(userId: string, clubId: string) {
  try {
    // Check if user is already a member or has a pending request
    const { data: existingMembership, error: membershipError } = await supabase
      .from('club_members')
      .select('role')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected
      throw membershipError;
    }

    if (existingMembership) {
      if (existingMembership.role === 'pending') {
        return { success: false, message: 'You already have a pending request to join this club' };
      } else {
        return { success: false, message: 'You are already a member of this club' };
      }
    }

    // Get club privacy setting
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('privacy')
      .eq('id', clubId)
      .single();

    if (clubError) throw clubError;
    if (!club) throw new Error('Club not found');

    // For public clubs, join directly; for private clubs, create a pending request
    const role = club.privacy === 'public' ? 'member' : 'pending';

    const { error: insertError } = await supabase
      .from('club_members')
      .insert([{ user_id: userId, club_id: clubId, role }]);

    if (insertError) throw insertError;

    const message = role === 'member'
      ? 'Successfully joined the club'
      : 'Request to join sent successfully';

    return { success: true, message };
  } catch (error: any) {
    console.error('[joinOrRequestClub] Error:', error);

    // Provide more specific error messages based on error type
    if (error.code === '23505') {
      // Unique constraint violation - user might already have a membership record
      throw new Error('You already have a relationship with this club');
    } else if (error.code === '23503') {
      // Foreign key constraint violation
      throw new Error('Invalid club or user ID');
    } else if (error.code === '42501') {
      // Permission denied (RLS policy violation)
      throw new Error('You don\'t have permission to join this club');
    } else if (error.code === '23514') {
      // Check constraint violation
      throw new Error('Invalid role type for club membership');
    } else if (error.message) {
      throw new Error(`Failed to join club: ${error.message}`);
    } else {
      throw new Error('Failed to join club. Please try again later.');
    }
  }
}

/**
 * Cancel a pending join request
 * @param userId Current user ID
 * @param clubId Club ID to cancel request for
 * @returns Success status
 */
export async function cancelJoinRequest(userId: string, clubId: string) {
  try {
    // Check if user has a pending request
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('role', 'pending')
      .single();

    if (membershipError) {
      if (membershipError.code === 'PGRST116') { // No rows returned
        return { success: false, message: 'No pending request found' };
      }
      throw membershipError;
    }

    // Delete the pending request
    const { error: deleteError } = await supabase
      .from('club_members')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('role', 'pending');

    if (deleteError) throw deleteError;

    return { success: true, message: 'Join request cancelled successfully' };
  } catch (error: any) {
    console.error('[cancelJoinRequest] Error:', error);

    // Provide more specific error messages based on error type
    if (error.code === '42501') {
      // Permission denied (RLS policy violation)
      throw new Error('You don\'t have permission to cancel this request');
    } else if (error.message) {
      throw new Error(`Failed to cancel request: ${error.message}`);
    } else {
      throw new Error('Failed to cancel request. Please try again later.');
    }
  }
}
