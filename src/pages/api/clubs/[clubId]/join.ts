/**
 * API endpoint for joining book clubs
 * 
 * Demonstrates enhanced membership limit enforcement
 * from Phase 2 Task 3: Backend Enforcement Logic
 * 
 * POST /api/clubs/[clubId]/join
 * - Allows users to join a book club
 * - Enforces club joining limits based on membership tier
 * - Handles premium/exclusive club restrictions
 * - Tracks role activity for analytics
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { 
  requireAuthentication,
  composeMiddleware 
} from '@/lib/entitlements/backend/middleware';
import { 
  enforceClubJoiningLimit,
  trackDetailedRoleActivity 
} from '@/lib/entitlements/backend';
import { 
  extractUserId,
  extractContextId,
  createEnforcementErrorResponse,
  withEnforcementTracking 
} from '@/lib/entitlements/backend/utils';

/**
 * Join club handler with comprehensive enforcement
 */
async function joinClubHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = extractUserId(req);
  const clubId = extractContextId(req, 'club');

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!clubId) {
    return res.status(400).json({ error: 'Club ID is required' });
  }

  try {
    // Check if club exists and get its details
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('id, name, privacy, is_premium, is_exclusive, store_id')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return res.status(404).json({
        error: 'Club not found',
        clubId
      });
    }

    // Enforce club joining limits
    const enforcementResult = await enforceClubJoiningLimit(userId, clubId);
    
    if (!enforcementResult.allowed) {
      const errorResponse = createEnforcementErrorResponse(enforcementResult, req);
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Handle private club join requests
    if (club.privacy === 'private') {
      // Check for existing membership or pending request
      const { data: existingMember } = await supabase
        .from('club_members')
        .select('role')
        .eq('user_id', userId)
        .eq('club_id', clubId)
        .single();

      if (existingMember) {
        const message = existingMember.role === 'pending'
          ? 'Your join request is pending approval'
          : 'You are already a member of this club';

        return res.status(400).json({
          error: 'Join request already exists',
          message
        });
      }

      // Parse answers from request body if provided
      const answers = req.body.answers;
      let joinAnswersData = null;

      if (answers && Array.isArray(answers)) {
        // Get question details for validation
        const { data: questions } = await supabase
          .from('club_join_questions')
          .select('*')
          .eq('club_id', clubId);

        if (questions && questions.length > 0) {
          // Build answers data with question context
          const answersWithContext = answers.map(answer => {
            const question = questions.find(q => q.id === answer.question_id);
            return {
              question_id: answer.question_id,
              question_text: question?.question_text || '',
              answer: answer.answer,
              is_required: question?.is_required || false
            };
          });

          joinAnswersData = {
            answers: answersWithContext,
            submitted_at: new Date().toISOString()
          };
        }
      }

      // Create pending membership with answers
      const { data: membership, error: membershipError } = await supabase
        .from('club_members')
        .insert({
          user_id: userId,
          club_id: clubId,
          role: 'pending',
          join_answers: joinAnswersData,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      if (membershipError) {
        console.error('Error creating join request:', membershipError);
        return res.status(500).json({
          error: 'Failed to create join request',
          details: membershipError.message
        });
      }

      // Track join request activity
      await trackDetailedRoleActivity({
        userId,
        roleType: 'MEMBER',
        action: 'REQUEST_CLUB_JOIN',
        contextId: clubId,
        contextType: 'club',
        metadata: {
          clubName: club.name,
          privacy: club.privacy,
          hasAnswers: !!joinAnswersData,
          timestamp: Date.now()
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Join request submitted successfully',
        requires_approval: true,
        joinRequest: {
          clubName: club.name,
          status: 'pending',
          requestedAt: membership.joined_at
        }
      });
    }

    // For public clubs, add user directly as member
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .insert({
        user_id: userId,
        club_id: clubId,
        role: 'member',
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      return res.status(500).json({
        error: 'Failed to join club',
        details: membershipError.message
      });
    }

    // Track successful club join activity
    await trackDetailedRoleActivity({
      userId,
      roleType: 'MEMBER',
      action: 'JOIN_CLUB',
      contextId: clubId,
      contextType: 'club',
      metadata: {
        clubName: club.name,
        privacy: club.privacy,
        isPremium: club.is_premium,
        isExclusive: club.is_exclusive,
        membershipId: membership.id,
        timestamp: Date.now()
      }
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Successfully joined club',
      membership: {
        id: membership.id,
        clubId: club.id,
        clubName: club.name,
        role: membership.role,
        joinedAt: membership.joined_at
      }
    });

  } catch (error) {
    console.error('Unexpected error joining club:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while joining the club'
    });
  }
}

/**
 * Main handler with middleware composition
 * 
 * Uses authentication middleware and custom enforcement logic
 */
const handler = composeMiddleware(
  requireAuthentication()
)(joinClubHandler);

// Export with enforcement tracking
export default withEnforcementTracking(handler, {
  endpoint: '/api/clubs/[clubId]/join',
  requiredPermission: 'CAN_JOIN_LIMITED_CLUBS',
  contextType: 'club'
});
