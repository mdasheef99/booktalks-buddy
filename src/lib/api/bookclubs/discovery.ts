import { supabase } from '../../supabase';

/**
 * Debug function to analyze total clubs in database
 * @param userId Current user ID for analysis
 */
export async function analyzeClubDatabase(userId: string) {
  try {
    // Get total clubs
    const { data: allClubs, error: allError } = await supabase
      .from('book_clubs')
      .select('id, name, privacy, lead_user_id');

    if (allError) throw allError;

    // Get user's created clubs
    const userCreatedClubs = allClubs?.filter(club => club.lead_user_id === userId) || [];

    // Get user's memberships
    const { data: memberships, error: memberError } = await supabase
      .from('club_members')
      .select('club_id, role')
      .eq('user_id', userId);

    if (memberError) throw memberError;

    const userJoinedClubIds = new Set(memberships?.map(m => m.club_id) || []);
    const userJoinedClubs = allClubs?.filter(club => userJoinedClubIds.has(club.id) && club.lead_user_id !== userId) || [];

    // Get creator tiers
    const creatorIds = allClubs?.map(club => club.lead_user_id) || [];
    const { data: creators, error: creatorError } = await supabase
      .from('users')
      .select('id, membership_tier')
      .in('id', creatorIds);

    if (creatorError) throw creatorError;

    const privilegedCreators = creators?.filter(c => c.membership_tier === 'PRIVILEGED' || c.membership_tier === 'PRIVILEGED_PLUS') || [];
    const privilegedClubs = allClubs?.filter(club => privilegedCreators.some(pc => pc.id === club.lead_user_id)) || [];

    console.log('=== CLUB DATABASE ANALYSIS (UPDATED LOGIC) ===');
    console.log(`Total clubs in database: ${allClubs?.length || 0}`);
    console.log(`User's created clubs: ${userCreatedClubs.length}`);
    console.log(`User's joined clubs: ${userJoinedClubs.length}`);
    console.log(`Clubs by privileged creators: ${privilegedClubs.length} (NO LONGER EXCLUDED)`);
    console.log(`✅ Actually discoverable clubs: ${(allClubs?.length || 0) - userCreatedClubs.length - userJoinedClubs.length}`);
    console.log(`Public clubs: ${allClubs?.filter(c => c.privacy === 'public').length || 0}`);
    console.log(`Private clubs: ${allClubs?.filter(c => c.privacy === 'private').length || 0}`);

    return {
      totalClubs: allClubs?.length || 0,
      userCreatedClubs: userCreatedClubs.length,
      userJoinedClubs: userJoinedClubs.length,
      privilegedClubs: privilegedClubs.length,
      actuallyDiscoverable: (allClubs?.length || 0) - userCreatedClubs.length - userJoinedClubs.length,
      publicClubs: allClubs?.filter(c => c.privacy === 'public').length || 0,
      privateClubs: allClubs?.filter(c => c.privacy === 'private').length || 0
    };
  } catch (error) {
    console.error('Error analyzing club database:', error);
    throw error;
  }
}

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
    // Build the query for clubs - include join_questions_enabled
    let query = supabase
      .from('book_clubs')
      .select('*, join_questions_enabled', { count: 'exact' });

    // Exclude clubs created by the current user
    query = query.not('lead_user_id', 'eq', userId);

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

    // Order by created_at but don't apply pagination yet (we need to filter first)
    query = query.order('created_at', { ascending: false });

    // Execute the query to get all matching clubs
    const { data: clubs, error } = await query;

    if (error) throw error;

    // If no clubs found, return empty result
    if (!clubs || clubs.length === 0) {
      return { clubs: [], count: 0 };
    }

    // Filter out clubs where user is already a member (only exclusion needed)
    const clubIds = clubs.map(club => club.id);

    // Get user's memberships to exclude clubs they're already in
    const { data: memberships, error: membershipError } = await supabase
      .from('club_members')
      .select('club_id, role')
      .eq('user_id', userId)
      .in('club_id', clubIds);

    if (membershipError) throw membershipError;

    // Create set of club IDs where user is already a member
    const memberClubIds = new Set(memberships?.map(m => m.club_id) || []);

    // Filter clubs - only exclude clubs where user is already a member
    const filteredClubs = clubs.filter(club => {
      // Exclude clubs where user is already a member
      return !memberClubIds.has(club.id);
    });

    // Apply pagination to filtered results
    const totalCount = filteredClubs.length;
    const paginatedClubs = filteredClubs.slice(offset, offset + limit);

    // Enhance paginated clubs with user status (all will be 'not-member' since we filtered out member clubs)
    const enhancedClubs = paginatedClubs.map(club => {
      return {
        ...club,
        user_status: 'not-member'
      };
    });

    // Simplified debug logging for analysis
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getDiscoverableClubs] === SIMPLIFIED FILTERING ANALYSIS ===`);
      console.log(`[getDiscoverableClubs] Initial query returned: ${clubs.length} clubs`);
      console.log(`[getDiscoverableClubs] User memberships found: ${memberships?.length || 0}`);

      // Analyze filtering step by step
      let step1_excludeCreated = clubs.filter(club => club.lead_user_id !== userId);
      console.log(`[getDiscoverableClubs] After excluding user's created clubs: ${step1_excludeCreated.length} (excluded ${clubs.length - step1_excludeCreated.length})`);

      let step2_excludeJoined = step1_excludeCreated.filter(club => !memberClubIds.has(club.id));
      console.log(`[getDiscoverableClubs] After excluding user's joined clubs: ${step2_excludeJoined.length} (excluded ${step1_excludeCreated.length - step2_excludeJoined.length})`);

      console.log(`[getDiscoverableClubs] ✅ NO privileged creator filtering applied - maximum discoverability`);

      // Show user's memberships
      console.log(`[getDiscoverableClubs] User's club memberships:`, memberships?.map(m => ({ club_id: m.club_id, role: m.role })));

      console.log(`[getDiscoverableClubs] Final result: ${totalCount} clubs, returning ${enhancedClubs.length} for page ${Math.floor(offset/limit) + 1}`);
      console.log('[getDiscoverableClubs] Final clubs:', enhancedClubs.map(club => ({
        id: club.id,
        name: club.name,
        privacy: club.privacy,
        lead_user_id: club.lead_user_id,
        user_status: club.user_status
      })));
    }

    return {
      clubs: enhancedClubs,
      count: totalCount
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
