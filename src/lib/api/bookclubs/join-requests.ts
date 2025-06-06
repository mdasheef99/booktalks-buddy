/**
 * Enhanced join request API with support for question answers
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  SubmitAnswersRequest,
  JoinRequestResponse,
  AnswersResponse,
  JoinRequestAnswer,
  JoinAnswersData
} from '@/types/join-request-questions';
import { QUESTION_CONSTRAINTS } from '@/types/join-request-questions';

// =========================
// Enhanced Join Request Functions
// =========================

/**
 * Submit a join request with optional answers to club questions
 */
export async function submitJoinRequestWithAnswers(
  clubId: string,
  answers?: SubmitAnswersRequest
): Promise<JoinRequestResponse> {
  try {
    // Get current user using consistent authentication pattern
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      };
    }

    // First, check if the club requires questions
    const { data: clubData, error: clubError } = await supabase
      .from('book_clubs')
      .select('join_questions_enabled, privacy')
      .eq('id', clubId)
      .single();

    if (clubError) {
      console.error('Error fetching club data:', clubError);
      return {
        success: false,
        message: 'Club not found',
        error: clubError.message
      };
    }

    // If club has questions enabled, validate answers
    if (clubData.join_questions_enabled && answers) {
      const validation = await validateJoinAnswers(clubId, answers);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Invalid answers provided',
          error: validation.error
        };
      }
    }

    // Prepare join answers data
    let joinAnswersData: JoinAnswersData | null = null;
    if (answers && answers.answers.length > 0) {
      // Store raw answer data (database constraint expects simple format)
      joinAnswersData = {
        answers: answers.answers.map(answer => ({
          question_id: answer.question_id,
          answer: answer.answer
        })),
        submitted_at: new Date().toISOString()
      };
    }

    // Determine the role based on club privacy
    const role = clubData.privacy === 'private' ? 'pending' : 'member';

    // Submit the join request
    const { data, error } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: user.id,
        role: role,
        join_answers: joinAnswersData as any // Cast to Json type for Supabase
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting join request:', error);
      
      // Handle duplicate membership
      if (error.message.includes('duplicate key')) {
        return {
          success: false,
          message: 'You have already requested to join this club',
          error: 'DUPLICATE_REQUEST'
        };
      }

      return {
        success: false,
        message: 'Failed to submit join request',
        error: error.message
      };
    }

    return {
      success: true,
      message: role === 'pending' 
        ? 'Join request submitted successfully. Awaiting approval.' 
        : 'Successfully joined the club!',
      requires_approval: role === 'pending',
      join_request_id: data.user_id
    };
  } catch (error) {
    console.error('Unexpected error submitting join request:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: 'NETWORK_ERROR'
    };
  }
}

/**
 * Get join request answers for a specific user and club
 */
export async function getJoinRequestAnswers(
  clubId: string,
  userId: string
): Promise<AnswersResponse> {
  try {
    // Get the join request with answers
    const { data: memberData, error: memberError } = await supabase
      .from('club_members')
      .select('join_answers')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .eq('role', 'pending')
      .single();

    if (memberError) {
      console.error('Error fetching join request:', memberError);
      return {
        success: false,
        error: memberError.message
      };
    }

    // Get user information
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username, displayname')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return {
        success: false,
        error: userError.message
      };
    }

    // Parse answers data with type safety
    const answersData = memberData.join_answers ?
      (memberData.join_answers as unknown as JoinAnswersData) : null;

    // Get club questions to enrich the raw answer data
    const { data: questions, error: questionsError } = await supabase
      .from('club_join_questions')
      .select('id, question_text, is_required, display_order')
      .eq('club_id', clubId)
      .order('display_order', { ascending: true });

    if (questionsError) {
      console.warn('Could not fetch club questions:', questionsError);
    }

    // Process raw answers into enriched format
    const processedAnswers: JoinRequestAnswer[] = answersData?.answers?.map(answer => {
      const question = questions?.find(q => q.id === answer.question_id);
      return {
        question_id: answer.question_id,
        question_text: question?.question_text || '',
        answer_text: answer.answer,
        is_required: question?.is_required || false,
        display_order: question?.display_order || 0
      };
    }).sort((a, b) => a.display_order - b.display_order) || [];

    return {
      success: true,
      answers: processedAnswers,
      user_info: {
        user_id: userId,
        username: userData.username,
        display_name: userData.displayname || userData.username
      },
      submitted_at: answersData?.submitted_at
    };
  } catch (error) {
    console.error('Unexpected error fetching join request answers:', error);
    return {
      success: false,
      error: 'Failed to fetch join request answers'
    };
  }
}

/**
 * Get all pending join requests with answers for a club
 */
export async function getClubJoinRequests(clubId: string): Promise<{
  success: boolean;
  requests?: Array<{
    user_id: string;
    username: string;
    display_name: string;
    requested_at: string;
    has_answers: boolean;
    answers: JoinRequestAnswer[];
  }>;
  error?: string;
}> {
  try {
    // Get pending join requests without join
    const { data: requests, error: requestsError } = await supabase
      .from('club_members')
      .select('user_id, joined_at, join_answers')
      .eq('club_id', clubId)
      .eq('role', 'pending')
      .order('joined_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching join requests:', requestsError);
      return {
        success: false,
        error: requestsError.message
      };
    }

    if (!requests || requests.length === 0) {
      return {
        success: true,
        requests: []
      };
    }

    // Get user details separately
    const userIds = requests.map(r => r.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, displayname')
      .in('id', userIds);

    if (usersError) {
      console.warn('Could not fetch user details:', usersError);
    }

    // Get club questions for answer processing
    const { data: questions, error: questionsError } = await supabase
      .from('club_join_questions')
      .select('id, question_text, is_required, display_order')
      .eq('club_id', clubId)
      .order('display_order', { ascending: true });

    if (questionsError) {
      console.warn('Could not fetch club questions:', questionsError);
    }

    // Format the response
    const formattedRequests = requests.map(request => {
      const user = users?.find(u => u.id === request.user_id);
      const answersData = request.join_answers ?
        (request.join_answers as unknown as JoinAnswersData) : null;

      // Process answers with question context
      let processedAnswers: JoinRequestAnswer[] = [];
      if (answersData?.answers && questions) {
        processedAnswers = answersData.answers
          .map(answer => {
            const question = questions.find(q => q.id === answer.question_id);
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

      return {
        user_id: request.user_id,
        username: user?.username || `user_${request.user_id.substring(0, 8)}`,
        display_name: user?.displayname || user?.username || `User ${request.user_id.substring(0, 8)}`,
        requested_at: request.joined_at || new Date().toISOString(),
        has_answers: !!answersData?.answers?.length,
        answers: processedAnswers
      };
    });

    return {
      success: true,
      requests: formattedRequests
    };
  } catch (error) {
    console.error('Unexpected error fetching club join requests:', error);
    return {
      success: false,
      error: 'Failed to fetch join requests'
    };
  }
}

// =========================
// Answer Validation
// =========================

interface AnswerValidationResult {
  isValid: boolean;
  error?: string;
  missingRequired?: string[];
}

async function validateJoinAnswers(
  clubId: string,
  answers: SubmitAnswersRequest
): Promise<AnswerValidationResult> {
  try {
    // Get all questions for the club
    const { data: questions, error } = await supabase
      .from('club_join_questions')
      .select('*')
      .eq('club_id', clubId);

    if (error) {
      return {
        isValid: false,
        error: 'Failed to fetch club questions'
      };
    }

    // Check for required questions
    const requiredQuestions = questions.filter(q => q.is_required);
    const answeredQuestionIds = answers.answers.map(a => a.question_id);
    const missingRequired = requiredQuestions
      .filter(q => !answeredQuestionIds.includes(q.id))
      .map(q => q.question_text);

    if (missingRequired.length > 0) {
      return {
        isValid: false,
        error: 'Missing answers for required questions',
        missingRequired
      };
    }

    // Validate answer lengths
    for (const answer of answers.answers) {
      if (answer.answer.length > QUESTION_CONSTRAINTS.MAX_ANSWER_LENGTH) {
        return {
          isValid: false,
          error: `Answer exceeds maximum length of ${QUESTION_CONSTRAINTS.MAX_ANSWER_LENGTH} characters`
        };
      }

      // Check if the question exists
      const question = questions.find(q => q.id === answer.question_id);
      if (!question) {
        return {
          isValid: false,
          error: 'Invalid question ID provided'
        };
      }

      // Check if required question has empty answer
      if (question.is_required && !answer.answer.trim()) {
        return {
          isValid: false,
          error: `Answer required for question: ${question.question_text}`
        };
      }
    }

    return {
      isValid: true
    };
  } catch (error) {
    console.error('Error validating answers:', error);
    return {
      isValid: false,
      error: 'Failed to validate answers'
    };
  }
}

// =========================
// Legacy Compatibility
// =========================

/**
 * Legacy join request function for backward compatibility
 */
export async function joinOrRequestClub(clubId: string): Promise<JoinRequestResponse> {
  return submitJoinRequestWithAnswers(clubId);
}
