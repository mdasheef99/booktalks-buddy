/**
 * Ultra-Simple Self-Deletion Request System
 * For BookTalks Buddy - Minimal complexity approach
 */

import { supabase } from '@/lib/supabase';

export interface SelfDeletionRequest {
  id: string;
  user_id: string;
  reason?: string;
  clubs_owned: Array<{ id: string; name: string }>;
  created_at: string;
}

export interface SelfDeletionRequestWithUser extends SelfDeletionRequest {
  user_name?: string;
  user_email?: string;
}

/**
 * Create a self-deletion request
 */
export async function createSelfDeletionRequest(
  userId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get user's owned clubs
    const { data: ownedClubs, error: clubsError } = await supabase
      .from('book_clubs')
      .select('id, name')
      .eq('lead_user_id', userId);

    if (clubsError) {
      throw new Error('Could not fetch owned clubs');
    }

    // Create the deletion request (simplified for single store setup)
    const { error: insertError } = await supabase
      .from('self_deletion_requests')
      .insert([{
        user_id: userId,
        reason: reason || null,
        clubs_owned: ownedClubs || []
      }]);

    if (insertError) {
      // Check if it's a duplicate request error
      if (insertError.code === '23505') { // Unique constraint violation
        return {
          success: false,
          message: 'You already have a pending deletion request. Please contact your store owner.'
        };
      }
      throw insertError;
    }

    return {
      success: true,
      message: 'Deletion request submitted successfully. Your store owner will process it within 3 business days.'
    };

  } catch (error) {
    console.error('Error creating self-deletion request:', error);
    return {
      success: false,
      message: `Failed to create deletion request: ${error.message}`
    };
  }
}

/**
 * Get all self-deletion requests for store owners
 * Filters requests to only show users from the same store context
 */
export async function getSelfDeletionRequests(): Promise<SelfDeletionRequestWithUser[]> {
  try {
    // Get all deletion requests with user information
    // Note: Store filtering will be handled by RLS policies for store owners
    const { data, error } = await supabase
      .from('self_deletion_requests')
      .select(`
        id,
        user_id,
        reason,
        clubs_owned,
        created_at,
        users!inner(
          displayname,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include user information
    return (data || []).map(request => ({
      id: request.id,
      user_id: request.user_id,
      reason: request.reason,
      clubs_owned: request.clubs_owned,
      created_at: request.created_at,
      user_name: request.users?.displayname || 'Unknown User',
      user_email: request.users?.email || 'No email'
    }));

  } catch (error) {
    console.error('Error fetching self-deletion requests:', error);
    throw error;
  }
}

/**
 * Check if user still owns any clubs (for deletion validation)
 */
export async function checkUserClubOwnership(userId: string): Promise<{
  ownsClubs: boolean;
  clubs: Array<{ id: string; name: string }>;
}> {
  try {
    const { data: ownedClubs, error } = await supabase
      .from('book_clubs')
      .select('id, name')
      .eq('lead_user_id', userId);

    if (error) throw error;

    return {
      ownsClubs: (ownedClubs || []).length > 0,
      clubs: ownedClubs || []
    };

  } catch (error) {
    console.error('Error checking club ownership:', error);
    return {
      ownsClubs: false,
      clubs: []
    };
  }
}

/**
 * Process deletion request (delete user account and remove request)
 */
export async function processSelfDeletionRequest(
  requestId: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the deletion request
    const { data: request, error: requestError } = await supabase
      .from('self_deletion_requests')
      .select('user_id, reason')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Deletion request not found');
    }

    // Check if user still owns clubs
    const clubCheck = await checkUserClubOwnership(request.user_id);
    
    if (clubCheck.ownsClubs) {
      const clubNames = clubCheck.clubs.map(club => club.name).join(', ');
      return {
        success: false,
        message: `Cannot delete account. User still owns clubs: ${clubNames}. Please transfer club leadership first.`
      };
    }

    // Import deleteUser function
    const { deleteUser } = await import('./accountManagement');

    // Delete the user account
    await deleteUser(adminId, request.user_id, {
      reason: `Store owner processed self-deletion request: ${request.reason || 'No reason provided'}`,
      backup_data: true
    });

    // Remove the deletion request
    const { error: deleteRequestError } = await supabase
      .from('self_deletion_requests')
      .delete()
      .eq('id', requestId);

    if (deleteRequestError) {
      console.error('Error removing deletion request:', deleteRequestError);
      // Don't fail the whole operation if we can't clean up the request
    }

    return {
      success: true,
      message: 'User account deleted successfully'
    };

  } catch (error) {
    console.error('Error processing deletion request:', error);
    return {
      success: false,
      message: `Failed to process deletion: ${error.message}`
    };
  }
}

/**
 * Delete a self-deletion request (if user changes mind or admin rejects)
 */
export async function deleteSelfDeletionRequest(
  requestId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('self_deletion_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting self-deletion request:', error);
      return {
        success: false,
        message: 'Failed to reject deletion request'
      };
    }

    return {
      success: true,
      message: 'Deletion request rejected successfully'
    };

  } catch (error) {
    console.error('Error deleting self-deletion request:', error);
    return {
      success: false,
      message: `Failed to reject deletion request: ${error.message}`
    };
  }
}
