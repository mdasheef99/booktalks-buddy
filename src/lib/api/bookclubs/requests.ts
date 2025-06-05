import { supabase } from '../../supabase';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { canManageClub } from '@/lib/entitlements/permissions';

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
    // Get user entitlements and check club management permission
    const entitlements = await getUserEntitlements(adminId);

    // Get club's store ID for contextual permission checking
    const { data: club } = await supabase
      .from('book_clubs')
      .select('store_id')
      .eq('id', clubId)
      .single();

    const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;

    if (!canManage) {
      console.log('🚨 Approve join request permission check failed for user:', adminId);
      console.log('📍 Club ID:', clubId);
      console.log('🔑 User entitlements:', entitlements);
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

    // Update role to member and clear join answers (atomic operation)
    const { error: updateError } = await supabase
      .from('club_members')
      .update({
        role: 'member',
        join_answers: null // Clear answers after approval for data retention
      })
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('role', 'pending'); // Ensure we only update if still pending

    if (updateError) throw updateError;

    console.log(`✅ Join request approved: User ${userId} approved for club ${clubId} by admin ${adminId}`);
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
    // Get user entitlements and check club management permission
    const entitlements = await getUserEntitlements(adminId);

    // Get club's store ID for contextual permission checking
    const { data: club } = await supabase
      .from('book_clubs')
      .select('store_id')
      .eq('id', clubId)
      .single();

    const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;

    if (!canManage) {
      console.log('🚨 Reject join request permission check failed for user:', adminId);
      console.log('📍 Club ID:', clubId);
      console.log('🔑 User entitlements:', entitlements);
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

    console.log(`❌ Join request rejected: User ${userId} rejected for club ${clubId} by admin ${adminId}`);
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
    // Get pending join requests for this club with answers
    const { data: pendingRequests, error: requestError } = await supabase
      .from('club_members')
      .select('user_id, club_id, role, joined_at, join_answers')
      .eq('club_id', clubId)
      .eq('role', 'pending')
      .order('joined_at', { ascending: false });

    if (requestError) throw requestError;

    if (!pendingRequests || pendingRequests.length === 0) {
      return [];
    }

    // Get user details from public.users table (separate query to avoid foreign key issues)
    const userIds = pendingRequests.map(request => request.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, displayname')
      .in('id', userIds);

    // If users query fails, continue with basic user info (user_id only)
    if (usersError) {
      console.warn('Could not fetch user details, using basic info:', usersError);
    }

    // Get club questions to match with answers
    const { data: clubQuestions, error: questionsError } = await supabase
      .from('club_join_questions')
      .select('id, question_text, is_required, display_order')
      .eq('club_id', clubId)
      .order('display_order', { ascending: true });

    if (questionsError) throw questionsError;

    // Format the response with user details and question-answer data
    const requests = pendingRequests.map(request => {
      // Find the matching user or use a default object
      const user = users?.find(u => u.id === request.user_id) || null;

      // Create a default user object with fallback to user_id
      const userObj = {
        username: 'Unknown',
        email: '',
        display_name: 'Unknown User'
      };

      // Update with actual data if available
      if (user) {
        userObj.username = user.username || `user_${request.user_id.substring(0, 8)}`;
        userObj.email = user.email || '';
        userObj.display_name = user.displayname || user.username || `User ${request.user_id.substring(0, 8)}`;
      } else {
        // Fallback when user details can't be fetched
        userObj.username = `user_${request.user_id.substring(0, 8)}`;
        userObj.display_name = `User ${request.user_id.substring(0, 8)}`;
      }

      // Process join answers if they exist
      let processedAnswers: Array<{
        question_id: string;
        question_text: string;
        answer_text: string;
        is_required: boolean;
        display_order: number;
      }> = [];

      let hasAnswers = false;

      if (request.join_answers && clubQuestions && clubQuestions.length > 0) {
        try {
          const answersData = request.join_answers as any;
          if (answersData.answers && Array.isArray(answersData.answers)) {
            hasAnswers = true;

            // Match answers with questions
            processedAnswers = answersData.answers
              .map((answer: any) => {
                const question = clubQuestions.find(q => q.id === answer.question_id);
                if (question) {
                  return {
                    question_id: question.id,
                    question_text: question.question_text,
                    answer_text: answer.answer || '',
                    is_required: question.is_required,
                    display_order: question.display_order
                  };
                }
                return null;
              })
              .filter(Boolean)
              .sort((a, b) => a.display_order - b.display_order);
          }
        } catch (error) {
          console.error('Error processing join answers:', error);
        }
      }

      return {
        user_id: request.user_id,
        club_id: request.club_id,
        requested_at: request.joined_at,
        status: request.role,
        user: userObj,
        answers: processedAnswers,
        has_answers: hasAnswers,
        // Legacy fields for backward compatibility
        username: userObj.username,
        display_name: userObj.display_name
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
