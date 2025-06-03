/**
 * API endpoint for reordering club join request questions
 * 
 * PUT /api/clubs/[clubId]/questions/reorder - Reorder questions
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { reorderClubQuestions } from '@/lib/api/bookclubs/questions';
import type { ReorderQuestionsRequest } from '@/types/join-request-questions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { clubId } = req.query;

  if (!clubId || typeof clubId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required'
    });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
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
      error: 'Only club leads can reorder questions'
    });
  }

  try {
    const reorderData: ReorderQuestionsRequest = req.body;
    
    // Validate request body
    if (!reorderData.question_orders || !Array.isArray(reorderData.question_orders)) {
      return res.status(400).json({
        success: false,
        error: 'Question orders array is required'
      });
    }

    // Validate each order entry
    for (const order of reorderData.question_orders) {
      if (!order.question_id || typeof order.display_order !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Each order entry must have question_id and display_order'
        });
      }
    }

    const result = await reorderClubQuestions(clubId, reorderData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in reorder questions API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
