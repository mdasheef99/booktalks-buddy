/**
 * API endpoint for managing individual club join request questions
 *
 * PUT /api/clubs/[clubId]/questions/[questionId] - Update a question (authenticated, club lead only)
 * DELETE /api/clubs/[clubId]/questions/[questionId] - Delete a question (authenticated, club lead only)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, validateClubLead } from '@/lib/api/middleware/auth';
import type { UpdateQuestionRequest } from '@/types/join-request-questions';
import { QUESTION_CONSTRAINTS } from '@/types/join-request-questions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { clubId, questionId } = req.query;

  if (!clubId || typeof clubId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required'
    });
  }

  if (!questionId || typeof questionId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Question ID is required'
    });
  }

  // All operations require authentication
  const authResult = await withAuth(req, res);
  if (!authResult) return; // Auth middleware handles response

  const { supabase, user } = authResult;

  // Verify user is club lead using RLS-enabled query
  const isClubLead = await validateClubLead(supabase, clubId, user.id);
  if (!isClubLead) {
    return res.status(403).json({
      success: false,
      error: 'Only club leads can manage questions'
    });
  }

  // Verify question exists and belongs to this club using RLS
  const { data: question, error: questionError } = await supabase
    .from('club_join_questions')
    .select('id, club_id')
    .eq('id', questionId)
    .eq('club_id', clubId)
    .single();

  if (questionError || !question) {
    return res.status(404).json({
      success: false,
      error: 'Question not found or access denied'
    });
  }

  try {
    switch (req.method) {
      case 'PUT':
        return await handleUpdateQuestion(req, res, supabase, questionId);
      case 'DELETE':
        return await handleDeleteQuestion(req, res, supabase, questionId);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Error in question management API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Handle PUT requests - Update question
 */
async function handleUpdateQuestion(req: NextApiRequest, res: NextApiResponse, supabase: any, questionId: string) {
  const updateData: UpdateQuestionRequest = req.body;

  // Validate input if provided
  if (updateData.question_text !== undefined) {
    if (!updateData.question_text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Question text cannot be empty'
      });
    }

    if (updateData.question_text.length > QUESTION_CONSTRAINTS.MAX_QUESTION_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Question text must be ${QUESTION_CONSTRAINTS.MAX_QUESTION_LENGTH} characters or less`
      });
    }
  }

  if (updateData.display_order !== undefined) {
    if (updateData.display_order < QUESTION_CONSTRAINTS.MIN_DISPLAY_ORDER ||
        updateData.display_order > QUESTION_CONSTRAINTS.MAX_DISPLAY_ORDER) {
      return res.status(400).json({
        success: false,
        error: `Display order must be between ${QUESTION_CONSTRAINTS.MIN_DISPLAY_ORDER} and ${QUESTION_CONSTRAINTS.MAX_DISPLAY_ORDER}`
      });
    }
  }

  // Build update fields
  const updateFields: any = {};
  if (updateData.question_text !== undefined) {
    updateFields.question_text = updateData.question_text.trim();
  }
  if (updateData.is_required !== undefined) {
    updateFields.is_required = updateData.is_required;
  }
  if (updateData.display_order !== undefined) {
    updateFields.display_order = updateData.display_order;
  }

  // Update using RLS-enabled client
  const { data: updatedQuestion, error: updateError } = await supabase
    .from('club_join_questions')
    .update(updateFields)
    .eq('id', questionId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating club question:', updateError);
    return res.status(400).json({
      success: false,
      error: updateError.message
    });
  }

  return res.status(200).json({
    success: true,
    question: updatedQuestion
  });
}

/**
 * Handle DELETE requests - Delete question
 */
async function handleDeleteQuestion(req: NextApiRequest, res: NextApiResponse, supabase: any, questionId: string) {
  // Delete using RLS-enabled client
  const { error: deleteError } = await supabase
    .from('club_join_questions')
    .delete()
    .eq('id', questionId);

  if (deleteError) {
    console.error('Error deleting club question:', deleteError);
    return res.status(400).json({
      success: false,
      error: deleteError.message
    });
  }

  return res.status(200).json({
    success: true
  });
}
