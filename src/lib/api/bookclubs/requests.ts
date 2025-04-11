import { supabase } from '../../supabase';

/**
 * Get all pending join requests with user and club details
 * @returns Array of pending join requests with user and club details
 */
export async function getPendingJoinRequests() {
  try {
    // Get all pending join requests
    const { data: pendingRequests, error: requestError } = await supabase
      .from('club_members')
      .select('*')
      .eq('role', 'pending')
      .order('joined_at', { ascending: false });

    if (requestError) throw requestError;
    
    if (!pendingRequests || pendingRequests.length === 0) {
      return [];
    }

    // Get club names for each request
    const clubIds = pendingRequests.map(req => req.club_id);
    const { data: clubs, error: clubError } = await supabase
      .from('book_clubs')
      .select('id, name')
      .in('id', clubIds);

    if (clubError) throw clubError;

    // Get usernames for each request
    const userIds = pendingRequests.map(req => req.user_id);
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);

    if (userError) throw userError;

    // Combine the data
    const enrichedRequests = pendingRequests.map(request => {
      const club = clubs?.find(c => c.id === request.club_id);
      const user = users?.find(u => u.id === request.user_id);
      
      return {
        ...request,
        club_name: club?.name,
        username: user?.username
      };
    });

    return enrichedRequests;
  } catch (error) {
    console.error('[getPendingJoinRequests] Error:', error);
    throw error;
  }
}

/**
 * Approve a join request
 * @param userId User ID of the request
 * @param clubId Club ID of the request
 * @returns Success status
 */
export async function approveJoinRequest(userId: string, clubId: string) {
  try {
    // Check if the request exists and is pending
    const { data: existingRequest, error: checkError } = await supabase
      .from('club_members')
      .select('role')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('role', 'pending')
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // No rows returned
        throw new Error('Join request not found or already processed');
      }
      throw checkError;
    }

    // Update role to member (atomic operation)
    const { error: updateError } = await supabase
      .from('club_members')
      .update({ role: 'member' })
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('role', 'pending'); // Ensure we only update if still pending

    if (updateError) throw updateError;

    return { success: true, message: 'Request approved successfully' };
  } catch (error) {
    console.error('[approveJoinRequest] Error:', error);
    throw error;
  }
}

/**
 * Deny a join request
 * @param userId User ID of the request
 * @param clubId Club ID of the request
 * @returns Success status
 */
export async function denyJoinRequest(userId: string, clubId: string) {
  try {
    // Check if the request exists and is pending
    const { data: existingRequest, error: checkError } = await supabase
      .from('club_members')
      .select('role')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('role', 'pending')
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') { // No rows returned
        throw new Error('Join request not found or already processed');
      }
      throw checkError;
    }

    // Delete the record (atomic operation)
    const { error: deleteError } = await supabase
      .from('club_members')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('role', 'pending'); // Ensure we only delete if still pending

    if (deleteError) throw deleteError;

    return { success: true, message: 'Request denied successfully' };
  } catch (error) {
    console.error('[denyJoinRequest] Error:', error);
    throw error;
  }
}
