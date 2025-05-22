import { supabase } from '../../supabase';
import { isClubAdmin } from '../auth';

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
  } catch (error: any) {
    console.error('[getPendingJoinRequests] Error:', error);

    if (error.code === '42501') {
      throw new Error('You don\'t have permission to view join requests');
    } else if (error.message) {
      throw new Error(`Failed to load join requests: ${error.message}`);
    } else {
      throw new Error('Failed to load join requests. Please try again later.');
    }
  }
}

/**
 * Approve a join request
 * @param adminId ID of the admin approving the request
 * @param clubId Club ID of the request
 * @param userId User ID of the request
 * @returns Success status
 */
export async function approveJoinRequest(adminId: string, clubId: string, userId: string) {
  try {
    // Check if the admin has permission
    if (!(await isClubAdmin(adminId, clubId))) {
      throw new Error('You don\'t have permission to approve join requests');
    }

    // Check if the request exists and is pending
    const { error: checkError } = await supabase
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
  } catch (error: any) {
    console.error('[approveJoinRequest] Error:', error);

    if (error.code === '42501') {
      throw new Error('You don\'t have permission to approve join requests');
    } else if (error.message) {
      throw new Error(`Failed to approve request: ${error.message}`);
    } else {
      throw new Error('Failed to approve request. Please try again later.');
    }
  }
}

/**
 * Deny a join request
 * @param adminId ID of the admin denying the request
 * @param clubId Club ID of the request
 * @param userId User ID of the request
 * @returns Success status
 */
export async function rejectJoinRequest(adminId: string, clubId: string, userId: string) {
  try {
    // Check if the admin has permission
    if (!(await isClubAdmin(adminId, clubId))) {
      throw new Error('You don\'t have permission to deny join requests');
    }

    // Check if the request exists and is pending
    const { error: checkError } = await supabase
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

    return { success: true, message: 'Request rejected successfully' };
  } catch (error: any) {
    console.error('[rejectJoinRequest] Error:', error);

    if (error.code === '42501') {
      throw new Error('You don\'t have permission to reject join requests');
    } else if (error.message) {
      throw new Error(`Failed to reject request: ${error.message}`);
    } else {
      throw new Error('Failed to reject request. Please try again later.');
    }
  }
}

/**
 * Get join requests for a specific club
 * @param clubId Club ID to get requests for
 * @returns Array of join requests with user details
 */
export async function getClubJoinRequests(clubId: string) {
  try {
    // Get pending join requests for this club
    const { data: pendingRequests, error: requestError } = await supabase
      .from('club_members')
      .select('user_id, club_id, role, joined_at')
      .eq('club_id', clubId)
      .eq('role', 'pending')
      .order('joined_at', { ascending: false });

    if (requestError) throw requestError;

    if (!pendingRequests || pendingRequests.length === 0) {
      return [];
    }

    // Get user details in a separate query
    const userIds = pendingRequests.map(request => request.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email')
      .in('id', userIds);

    if (usersError) throw usersError;

    // Format the response with user details
    const requests = pendingRequests.map(request => {
      // Find the matching user or use a default object
      const user = users?.find(u => u.id === request.user_id) || null;

      // Create a default user object
      const userObj = {
        username: 'Unknown',
        email: '',
        display_name: 'Unknown User'
      };

      // Update with actual data if available
      if (user) {
        userObj.username = user.username || 'Unknown';
        userObj.email = user.email || '';
        // Since display_name might not exist, we'll use username as a fallback
        userObj.display_name = user.username || 'Unknown User';
      }

      return {
        user_id: request.user_id,
        club_id: request.club_id,
        requested_at: request.joined_at,
        status: request.role,
        user: userObj
      };
    });

    return requests;
  } catch (error: any) {
    console.error('[getClubJoinRequests] Error:', error);

    if (error.code === '42501') {
      throw new Error('You don\'t have permission to view join requests for this club');
    } else if (error.message) {
      throw new Error(`Failed to load club join requests: ${error.message}`);
    } else {
      throw new Error('Failed to load club join requests. Please try again later.');
    }
  }
}
