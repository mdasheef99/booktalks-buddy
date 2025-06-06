/**
 * API endpoint for managing club join request questions
 *
 * GET /api/clubs/[clubId]/questions - Get all questions for a club (public access with RLS)
 * POST /api/clubs/[clubId]/questions - Create a new question (authenticated, club lead only)
 * PUT /api/clubs/[clubId]/questions - Toggle questions enabled/disabled (authenticated, club lead only)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withPublicAccess, validateClubLead, createErrorResponse, createSuccessResponse } from '@/lib/api/middleware/auth';
import type { CreateQuestionRequest } from '@/types/join-request-questions';
import { QUESTION_CONSTRAINTS } from '@/types/join-request-questions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { clubId } = req.query;

  if (!clubId || typeof clubId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetQuestions(req, res, clubId);
      case 'POST':
        return await handleCreateQuestion(req, res, clubId);
      case 'PUT':
        return await handleToggleQuestions(req, res, clubId);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Error in questions API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Handle GET requests - Public access with RLS
 */
async function handleGetQuestions(req: NextApiRequest, res: NextApiResponse, clubId: string) {
  const { supabase } = await withPublicAccess(req, res);

  const { data: questions, error } = await supabase
    .from('club_join_questions')
    .select('*')
    .eq('club_id', clubId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching club questions:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }

  return res.status(200).json({
    success: true,
    questions: questions || []
  });
}

/**
 * Handle POST requests - Create new question (authenticated, club lead only)
 */
async function handleCreateQuestion(req: NextApiRequest, res: NextApiResponse, clubId: string) {
  const authResult = await withAuth(req, res);
  if (!authResult) return; // Auth middleware handles response

  const { supabase, user } = authResult;
  const questionData: CreateQuestionRequest = req.body;

  // Verify user is club lead
  const isClubLead = await validateClubLead(supabase, clubId, user.id);
  if (!isClubLead) {
    return res.status(403).json({
      success: false,
      error: 'Only club leads can manage questions'
    });
  }

  // Validate required fields
  if (!questionData.question_text || questionData.display_order === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Question text and display order are required'
    });
  }

  // Validate question text length
  if (questionData.question_text.length > QUESTION_CONSTRAINTS.MAX_QUESTION_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Question text must be ${QUESTION_CONSTRAINTS.MAX_QUESTION_LENGTH} characters or less`
    });
  }

  // Check question limit
  const { data: existingQuestions, error: countError } = await supabase
    .from('club_join_questions')
    .select('id')
    .eq('club_id', clubId);

  if (countError) {
    return res.status(500).json({
      success: false,
      error: 'Failed to check question limit'
    });
  }

  if (existingQuestions && existingQuestions.length >= QUESTION_CONSTRAINTS.MAX_QUESTIONS_PER_CLUB) {
    return res.status(400).json({
      success: false,
      error: `Maximum of ${QUESTION_CONSTRAINTS.MAX_QUESTIONS_PER_CLUB} questions allowed per club`
    });
  }

  // Create the question using RLS-enabled client
  const { data: newQuestion, error: createError } = await supabase
    .from('club_join_questions')
    .insert({
      club_id: clubId,
      question_text: questionData.question_text.trim(),
      is_required: questionData.is_required || false,
      display_order: questionData.display_order
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating club question:', createError);
    return res.status(400).json({
      success: false,
      error: createError.message
    });
  }

  return res.status(201).json({
    success: true,
    question: newQuestion
  });
}

/**
 * Handle PUT requests - Toggle questions enabled/disabled (authenticated, club lead only)
 */
async function handleToggleQuestions(req: NextApiRequest, res: NextApiResponse, clubId: string) {
  const authResult = await withAuth(req, res);
  if (!authResult) return; // Auth middleware handles response

  const { supabase, user } = authResult;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'Enabled flag must be a boolean'
    });
  }

  // Update using RLS-enabled client (will only work if user is club lead due to RLS)
  const { error } = await supabase
    .from('book_clubs')
    .update({ join_questions_enabled: enabled })
    .eq('id', clubId)
    .eq('lead_user_id', user.id); // Explicit check for club lead

  if (error) {
    console.error('Error toggling club questions:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  return res.status(200).json({
    success: true
  });
}
