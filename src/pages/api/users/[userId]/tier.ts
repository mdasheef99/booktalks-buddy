import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { hasEntitlement, canManageUserTiers } from '@/lib/entitlements';

/**
 * API endpoint for managing user tiers
 * 
 * PUT /api/users/[userId]/tier
 * - Updates a user's account tier
 * - Requires CAN_MANAGE_USER_TIERS entitlement
 * 
 * GET /api/users/[userId]/tier
 * - Gets a user's current account tier
 * - Requires authentication
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  const currentUser = session?.user;

  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId } = req.query;
  
  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  try {
    // Handle GET request - get user's current tier
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('account_tier')
        .eq('id', userId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ tier: data.account_tier });
    }
    
    // Handle PUT request - update user's tier
    if (req.method === 'PUT') {
      const { tier, storeId } = req.body;
      
      if (!tier || !storeId) {
        return res.status(400).json({ error: 'Missing required fields: tier, storeId' });
      }
      
      if (!['free', 'privileged', 'privileged_plus'].includes(tier)) {
        return res.status(400).json({ error: 'Invalid tier. Must be one of: free, privileged, privileged_plus' });
      }
      
      // Check if the current user has permission to manage user tiers
      const entitlements = await getUserEntitlements(currentUser.id);
      
      if (!canManageUserTiers(entitlements, storeId)) {
        return res.status(403).json({ error: 'You do not have permission to manage user tiers' });
      }
      
      // Update the user's tier
      const { data, error } = await supabase
        .from('users')
        .update({ account_tier: tier })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        return res.status(500).json({ error: 'Failed to update user tier' });
      }
      
      // Invalidate the user's entitlements cache
      // This will be done client-side when the user logs in next
      
      return res.status(200).json({ 
        message: 'User tier updated successfully',
        user: {
          id: data.id,
          account_tier: data.account_tier
        }
      });
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in user tier API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
