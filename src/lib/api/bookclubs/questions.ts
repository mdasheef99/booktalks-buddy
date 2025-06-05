/**
 * API functions for managing club join request questions
 */

import { supabase } from '@/integrations/supabase/client';
import { validateClubId } from '@/lib/utils/validation';
import type {
  ClubJoinQuestion,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ReorderQuestionsRequest,
  QuestionResponse,
  QuestionsListResponse,
  JoinRequestError
} from '@/types/join-request-questions';
import { JOIN_REQUEST_ERROR_CODES, QUESTION_CONSTRAINTS } from '@/types/join-request-questions';

// =========================
// Question CRUD Operations
// =========================

/**
 * Get all questions for a specific club (public access for discovery)
 */
export async function getClubQuestions(clubId: string): Promise<QuestionsListResponse> {
  try {
    // Validate clubId
    const validation = validateClubId(clubId);
    if (!validation.isValid) {
      console.error('Invalid clubId provided to getClubQuestions:', clubId);
      return {
        success: false,
        error: validation.error || 'Invalid club ID'
      };
    }

    // Use direct database access for public questions (no auth required, RLS handles security)
    const { data, error } = await supabase
      .from('club_join_questions')
      .select('*')
      .eq('club_id', clubId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching club questions:', error);
      return {
        success: false,
        error: `Failed to fetch questions: ${error.message}`
      };
    }

    return {
      success: true,
      questions: data || []
    };
  } catch (error) {
    console.error('Unexpected error fetching club questions:', error);
    return {
      success: false,
      error: 'Network error occurred while fetching questions'
    };
  }
}

/**
 * Get all questions for a specific club (direct database access for management)
 */
export async function getClubQuestionsForManagement(clubId: string): Promise<QuestionsListResponse> {
  try {
    // Validate clubId
    const validation = validateClubId(clubId);
    if (!validation.isValid) {
      console.error('Invalid clubId provided to getClubQuestionsForManagement:', clubId);
      return {
        success: false,
        error: validation.error
      };
    }

    const { data, error } = await supabase
      .from('club_join_questions')
      .select('*')
      .eq('club_id', clubId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching club questions:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      questions: data || []
    };
  } catch (error) {
    console.error('Unexpected error fetching club questions:', error);
    return {
      success: false,
      error: 'Failed to fetch club questions'
    };
  }
}

/**
 * Create a new question for a club
 */
export async function createClubQuestion(
  clubId: string,
  questionData: CreateQuestionRequest
): Promise<QuestionResponse> {
  try {
    // Validate clubId
    if (!clubId || clubId === 'undefined' || clubId === 'null') {
      console.error('Invalid clubId provided to createClubQuestion:', clubId);
      return {
        success: false,
        error: 'Invalid club ID provided'
      };
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clubId)) {
      console.error('Invalid UUID format for clubId:', clubId);
      return {
        success: false,
        error: 'Invalid club ID format'
      };
    }

    // Validate input
    const validation = validateQuestionData(questionData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Check if club has reached question limit
    const existingQuestions = await getClubQuestionsForManagement(clubId);
    if (existingQuestions.success && existingQuestions.questions) {
      if (existingQuestions.questions.length >= QUESTION_CONSTRAINTS.MAX_QUESTIONS_PER_CLUB) {
        return {
          success: false,
          error: 'Maximum of 5 questions allowed per club'
        };
      }
    }

    const { data, error } = await supabase
      .from('club_join_questions')
      .insert({
        club_id: clubId,
        question_text: questionData.question_text.trim(),
        is_required: questionData.is_required,
        display_order: questionData.display_order
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating club question:', error);
      
      // Handle specific database errors
      if (error.message.includes('Maximum of 5 questions')) {
        return {
          success: false,
          error: 'Maximum of 5 questions allowed per club'
        };
      }
      
      if (error.message.includes('duplicate key')) {
        return {
          success: false,
          error: 'A question with this order already exists'
        };
      }

      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      question: data
    };
  } catch (error) {
    console.error('Unexpected error creating club question:', error);
    return {
      success: false,
      error: 'Failed to create question'
    };
  }
}

/**
 * Update an existing question
 */
export async function updateClubQuestion(
  questionId: string,
  questionData: UpdateQuestionRequest
): Promise<QuestionResponse> {
  try {
    // Validate input if provided
    if (questionData.question_text !== undefined) {
      if (!questionData.question_text.trim() || 
          questionData.question_text.length > QUESTION_CONSTRAINTS.MAX_QUESTION_LENGTH) {
        return {
          success: false,
          error: `Question text must be between 1 and ${QUESTION_CONSTRAINTS.MAX_QUESTION_LENGTH} characters`
        };
      }
    }

    const updateData: any = {};
    if (questionData.question_text !== undefined) {
      updateData.question_text = questionData.question_text.trim();
    }
    if (questionData.is_required !== undefined) {
      updateData.is_required = questionData.is_required;
    }
    if (questionData.display_order !== undefined) {
      updateData.display_order = questionData.display_order;
    }

    const { data, error } = await supabase
      .from('club_join_questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating club question:', error);
      
      if (error.message.includes('duplicate key')) {
        return {
          success: false,
          error: 'A question with this order already exists'
        };
      }

      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      question: data
    };
  } catch (error) {
    console.error('Unexpected error updating club question:', error);
    return {
      success: false,
      error: 'Failed to update question'
    };
  }
}

/**
 * Delete a question
 */
export async function deleteClubQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('club_join_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      console.error('Error deleting club question:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected error deleting club question:', error);
    return {
      success: false,
      error: 'Failed to delete question'
    };
  }
}

/**
 * Reorder questions for a club
 */
export async function reorderClubQuestions(
  clubId: string,
  reorderData: ReorderQuestionsRequest
): Promise<QuestionsListResponse> {
  try {
    // Validate that all orders are unique and within bounds
    const orders = reorderData.question_orders.map(q => q.display_order);
    const uniqueOrders = new Set(orders);
    
    if (uniqueOrders.size !== orders.length) {
      return {
        success: false,
        error: 'Duplicate display orders are not allowed'
      };
    }

    if (orders.some(order => order < 1 || order > QUESTION_CONSTRAINTS.MAX_QUESTIONS_PER_CLUB)) {
      return {
        success: false,
        error: `Display order must be between 1 and ${QUESTION_CONSTRAINTS.MAX_QUESTIONS_PER_CLUB}`
      };
    }

    // Update each question's display order
    const updatePromises = reorderData.question_orders.map(({ question_id, display_order }) =>
      supabase
        .from('club_join_questions')
        .update({ display_order })
        .eq('id', question_id)
        .eq('club_id', clubId) // Ensure question belongs to this club
    );

    const results = await Promise.all(updatePromises);
    
    // Check if any updates failed
    const failedUpdate = results.find(result => result.error);
    if (failedUpdate) {
      console.error('Error reordering questions:', failedUpdate.error);
      return {
        success: false,
        error: failedUpdate.error.message
      };
    }

    // Return updated questions list
    return await getClubQuestionsForManagement(clubId);
  } catch (error) {
    console.error('Unexpected error reordering questions:', error);
    return {
      success: false,
      error: 'Failed to reorder questions'
    };
  }
}

// =========================
// Club Questions Settings
// =========================

/**
 * Toggle questions enabled/disabled for a club
 */
export async function toggleClubQuestions(
  clubId: string, 
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('book_clubs')
      .update({ join_questions_enabled: enabled })
      .eq('id', clubId);

    if (error) {
      console.error('Error toggling club questions:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected error toggling club questions:', error);
    return {
      success: false,
      error: 'Failed to update club questions setting'
    };
  }
}

/**
 * Check if a club has questions enabled
 */
export async function getClubQuestionsStatus(clubId: string): Promise<{
  success: boolean;
  enabled?: boolean;
  error?: string;
}> {
  try {
    // Validate clubId
    if (!clubId || clubId === 'undefined' || clubId === 'null') {
      console.error('Invalid clubId provided to getClubQuestionsStatus:', clubId);
      return {
        success: false,
        error: 'Invalid club ID provided'
      };
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clubId)) {
      console.error('Invalid UUID format for clubId:', clubId);
      return {
        success: false,
        error: 'Invalid club ID format'
      };
    }

    const { data, error } = await supabase
      .from('book_clubs')
      .select('join_questions_enabled')
      .eq('id', clubId)
      .single();

    if (error) {
      console.error('Error fetching club questions status:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      enabled: data?.join_questions_enabled || false
    };
  } catch (error) {
    console.error('Unexpected error fetching club questions status:', error);
    return {
      success: false,
      error: 'Failed to fetch club questions status'
    };
  }
}

// =========================
// Validation Helpers
// =========================

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

function validateQuestionData(data: CreateQuestionRequest): ValidationResult {
  if (!data.question_text || !data.question_text.trim()) {
    return {
      isValid: false,
      error: 'Question text is required'
    };
  }

  if (data.question_text.length > QUESTION_CONSTRAINTS.MAX_QUESTION_LENGTH) {
    return {
      isValid: false,
      error: `Question text must be ${QUESTION_CONSTRAINTS.MAX_QUESTION_LENGTH} characters or less`
    };
  }

  if (data.display_order < QUESTION_CONSTRAINTS.MIN_DISPLAY_ORDER || 
      data.display_order > QUESTION_CONSTRAINTS.MAX_DISPLAY_ORDER) {
    return {
      isValid: false,
      error: `Display order must be between ${QUESTION_CONSTRAINTS.MIN_DISPLAY_ORDER} and ${QUESTION_CONSTRAINTS.MAX_DISPLAY_ORDER}`
    };
  }

  return {
    isValid: true
  };
}
