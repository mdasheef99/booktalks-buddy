/**
 * API endpoint for creating book clubs
 * 
 * Demonstrates the new backend enforcement logic implementation
 * from Phase 2 Task 3: Backend Enforcement Logic
 * 
 * POST /api/clubs/create
 * - Creates a new book club
 * - Enforces club creation limits based on membership tier
 * - Tracks role activity for analytics
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { 
  requireAuthentication, 
  requirePermission,
  composeMiddleware 
} from '@/lib/entitlements/backend/middleware';
import { 
  enforceClubCreationLimit,
  trackDetailedRoleActivity 
} from '@/lib/entitlements/backend';
import { 
  extractUserId,
  createEnforcementErrorResponse,
  withEnforcementTracking 
} from '@/lib/entitlements/backend/utils';

/**
 * Create club handler with comprehensive enforcement
 */
async function createClubHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { name, description, privacy, storeId, tags } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'description']
      });
    }

    // Enforce club creation limits
    const enforcementResult = await enforceClubCreationLimit(userId, storeId);
    
    if (!enforcementResult.allowed) {
      const errorResponse = createEnforcementErrorResponse(enforcementResult, req);
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Create the club
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .insert({
        name: name.trim(),
        description: description.trim(),
        privacy: privacy || 'public',
        store_id: storeId || '00000000-0000-0000-0000-000000000000',
        lead_user_id: userId,
        tags: tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (clubError) {
      console.error('Error creating club:', clubError);
      return res.status(500).json({
        error: 'Failed to create club',
        details: clubError.message
      });
    }

    // Track the successful club creation activity
    await trackDetailedRoleActivity({
      userId,
      roleType: 'CLUB_LEAD',
      action: 'CREATE_CLUB',
      contextId: club.id,
      contextType: 'club',
      metadata: {
        clubName: club.name,
        privacy: club.privacy,
        storeId: club.store_id,
        timestamp: Date.now()
      }
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      club: {
        id: club.id,
        name: club.name,
        description: club.description,
        privacy: club.privacy,
        leadUserId: club.lead_user_id,
        storeId: club.store_id,
        tags: club.tags,
        createdAt: club.created_at
      }
    });

  } catch (error) {
    console.error('Unexpected error creating club:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the club'
    });
  }
}

/**
 * Main handler with middleware composition
 * 
 * Demonstrates the new middleware system for automatic permission checking
 */
const handler = composeMiddleware(
  requireAuthentication(),
  requirePermission({
    entitlement: 'CAN_CREATE_LIMITED_CLUBS', // Will also check for CAN_CREATE_UNLIMITED_CLUBS
    customCheck: async (req) => {
      // Custom check for club creation permission
      const userId = extractUserId(req);
      if (!userId) return false;

      const enforcementResult = await enforceClubCreationLimit(userId, req.body?.storeId);
      return enforcementResult.allowed;
    }
  })
)(createClubHandler);

// Export with enforcement tracking
export default withEnforcementTracking(handler, {
  endpoint: '/api/clubs/create',
  requiredPermission: 'CAN_CREATE_LIMITED_CLUBS',
  contextType: 'club'
});
