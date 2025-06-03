/**
 * API endpoint for managing club join requests and answers
 * 
 * GET /api/clubs/[clubId]/join-requests - Get all pending join requests for a club
 * GET /api/clubs/[clubId]/join-requests/[userId] - Get specific join request with answers
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { 
  getClubJoinRequests,
  getJoinRequestAnswers 
} from '@/lib/api/bookclubs/join-requests';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { clubId, userId } = req.query;

  if (!clubId || typeof clubId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required'
    });
  }

  if (req.method !== 'GET') {
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
      error: 'Only club leads can view join requests'
    });
  }

  try {
    if (userId && typeof userId === 'string') {
      // Get specific join request with answers
      const result = await getJoinRequestAnswers(clubId, userId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } else {
      // Get all pending join requests
      const result = await getClubJoinRequests(clubId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    }
  } catch (error) {
    console.error('Error in join requests API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
