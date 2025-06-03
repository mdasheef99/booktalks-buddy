/**
 * API endpoint for managing club join request questions
 * 
 * GET /api/clubs/[clubId]/questions - Get all questions for a club
 * POST /api/clubs/[clubId]/questions - Create a new question
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { CreateQuestionRequest } from '@/types/join-request-questions';

// Create server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { clubId } = req.query;

  if (!clubId || typeof clubId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required'
    });
  }

  // For GET requests, allow public access for discovery
  // For other methods, require authentication
  let user = null;

  if (req.method !== 'GET') {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    user = authUser;
  }

  // Verify user is club lead for write operations
  if (req.method !== 'GET' && user) {
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

    if (club.lead_user_id !== user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Only club leads can manage questions'
      });
    }
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get questions for the club with public access
        const { data: questions, error: questionsError } = await supabase
          .from('club_join_questions')
          .select('*')
          .eq('club_id', clubId)
          .order('display_order', { ascending: true });

        if (questionsError) {
          console.error('Error fetching club questions:', questionsError);
          return res.status(500).json({
            success: false,
            error: questionsError.message
          });
        }

        return res.status(200).json({
          success: true,
          questions: questions || []
        });

      case 'POST':
        const questionData: CreateQuestionRequest = req.body;

        // Validate required fields
        if (!questionData.question_text || !questionData.display_order) {
          return res.status(400).json({
            success: false,
            error: 'Question text and display order are required'
          });
        }

        // Validate question text length
        if (questionData.question_text.length > 200) {
          return res.status(400).json({
            success: false,
            error: 'Question text must be 200 characters or less'
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

        if (existingQuestions && existingQuestions.length >= 5) {
          return res.status(400).json({
            success: false,
            error: 'Maximum of 5 questions allowed per club'
          });
        }

        // Create the question
        const { data: newQuestion, error: createError } = await supabase
          .from('club_join_questions')
          .insert({
            club_id: clubId,
            question_text: questionData.question_text.trim(),
            is_required: questionData.is_required,
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

      case 'PUT':
        // Handle toggle questions enabled/disabled
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: 'Enabled flag must be a boolean'
          });
        }

        const { error: toggleError } = await supabase
          .from('book_clubs')
          .update({ join_questions_enabled: enabled })
          .eq('id', clubId);

        if (toggleError) {
          console.error('Error toggling club questions:', toggleError);
          return res.status(400).json({
            success: false,
            error: toggleError.message
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
    console.error('Error in questions API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
