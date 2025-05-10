import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { hasEntitlement, hasContextualEntitlement } from '@/lib/entitlements';

/**
 * API endpoint for managing store administrators
 * 
 * GET /api/stores/[storeId]/administrators
 * - Gets all administrators for a store
 * - Requires authentication
 * 
 * POST /api/stores/[storeId]/administrators
 * - Adds a new administrator to a store
 * - Requires STORE_OWNER_[storeId] entitlement
 * 
 * DELETE /api/stores/[storeId]/administrators/[userId]
 * - Removes an administrator from a store
 * - Requires STORE_OWNER_[storeId] entitlement
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  const currentUser = session?.user;

  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { storeId } = req.query;
  
  if (typeof storeId !== 'string') {
    return res.status(400).json({ error: 'Invalid storeId' });
  }

  try {
    // Get the current user's entitlements
    const entitlements = await getUserEntitlements(currentUser.id);
    
    // Handle GET request - get store administrators
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('store_administrators')
        .select(`
          user_id,
          role,
          assigned_at,
          assigned_by,
          users:user_id (
            username,
            email
          )
        `)
        .eq('store_id', storeId);

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch store administrators' });
      }

      return res.status(200).json({ administrators: data });
    }
    
    // Handle POST request - add a new administrator
    if (req.method === 'POST') {
      // Check if the current user is a store owner
      if (!hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId)) {
        return res.status(403).json({ error: 'Only store owners can add administrators' });
      }
      
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ error: 'Missing required fields: userId, role' });
      }
      
      if (!['owner', 'manager'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be one of: owner, manager' });
      }
      
      // Check if the user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (userError || !userData) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add the administrator
      const { data, error } = await supabase
        .from('store_administrators')
        .insert({
          store_id: storeId,
          user_id: userId,
          role,
          assigned_by: currentUser.id
        })
        .select()
        .single();
        
      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          return res.status(409).json({ error: 'User is already an administrator for this store' });
        }
        
        return res.status(500).json({ error: 'Failed to add administrator' });
      }
      
      return res.status(201).json({ 
        message: 'Administrator added successfully',
        administrator: data
      });
    }
    
    // Handle DELETE request - remove an administrator
    if (req.method === 'DELETE') {
      // Check if the current user is a store owner
      if (!hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId)) {
        return res.status(403).json({ error: 'Only store owners can remove administrators' });
      }
      
      const { userId } = req.query;
      
      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'Invalid userId' });
      }
      
      // Prevent removing yourself
      if (userId === currentUser.id) {
        return res.status(400).json({ error: 'You cannot remove yourself as an administrator' });
      }
      
      // Remove the administrator
      const { error } = await supabase
        .from('store_administrators')
        .delete()
        .eq('store_id', storeId)
        .eq('user_id', userId);
        
      if (error) {
        return res.status(500).json({ error: 'Failed to remove administrator' });
      }
      
      return res.status(200).json({ 
        message: 'Administrator removed successfully'
      });
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in store administrators API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
