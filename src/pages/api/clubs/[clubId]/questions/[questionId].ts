/**
 * API endpoint for managing individual club join request questions
 * 
 * PUT /api/clubs/[clubId]/questions/[questionId] - Update a question
 * DELETE /api/clubs/[clubId]/questions/[questionId] - Delete a question
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { UpdateQuestionRequest } from '@/types/join-request-questions';

// Create server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

  // Get current user from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Verify user is club lead
  const { data: club, error: clubError } = await supabase
    .from('book_clubs')
    .select('lead_user_id')
    .eq('id', clubId)
    .single();

  if (clubError || !club) {
    return res.status(404).json({
      success: false,
      error: 'Club not found'
    });
  }

  if (club.lead_user_id !== user.id) {
    return res.status(403).json({
      success: false,
      error: 'Only club leads can manage questions'
    });
  }

  // Verify question belongs to this club
  const { data: question, error: questionError } = await supabase
    .from('club_join_questions')
    .select('club_id')
    .eq('id', questionId)
    .single();

  if (questionError || !question) {
    return res.status(404).json({
      success: false,
      error: 'Question not found'
    });
  }

  if (question.club_id !== clubId) {
    return res.status(403).json({
      success: false,
      error: 'Question does not belong to this club'
    });
  }

  try {
    switch (req.method) {
      case 'PUT':
        const updateData: UpdateQuestionRequest = req.body;

        // Validate input if provided
        if (updateData.question_text !== undefined) {
          if (!updateData.question_text.trim() || updateData.question_text.length > 200) {
            return res.status(400).json({
              success: false,
              error: 'Question text must be between 1 and 200 characters'
            });
          }
        }

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

      case 'DELETE':
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
