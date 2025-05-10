import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { hasEntitlement, hasContextualEntitlement, canManageClub } from '@/lib/entitlements';

/**
 * API endpoint for managing club moderators
 * 
 * GET /api/clubs/[clubId]/moderators
 * - Gets all moderators for a club
 * - Requires authentication
 * 
 * POST /api/clubs/[clubId]/moderators
 * - Adds a new moderator to a club
 * - Requires CLUB_LEAD_[clubId] entitlement or store admin
 * 
 * DELETE /api/clubs/[clubId]/moderators/[userId]
 * - Removes a moderator from a club
 * - Requires CLUB_LEAD_[clubId] entitlement or store admin
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  const currentUser = session?.user;

  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { clubId } = req.query;
  
  if (typeof clubId !== 'string') {
    return res.status(400).json({ error: 'Invalid clubId' });
  }

  try {
    // Get the current user's entitlements
    const entitlements = await getUserEntitlements(currentUser.id);
    
    // Get the club's store ID
    const { data: clubData, error: clubError } = await supabase
      .from('book_clubs')
      .select('store_id')
      .eq('id', clubId)
      .single();
      
    if (clubError || !clubData) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    const storeId = clubData.store_id;
    
    // Handle GET request - get club moderators
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('club_moderators')
        .select(`
          user_id,
          assigned_at,
          assigned_by_user_id,
          users:user_id (
            username,
            email
          )
        `)
        .eq('club_id', clubId);

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch club moderators' });
      }

      return res.status(200).json({ moderators: data });
    }
    
    // Handle POST request - add a new moderator
    if (req.method === 'POST') {
      // Check if the current user can manage the club
      if (!canManageClub(entitlements, clubId, storeId)) {
        return res.status(403).json({ error: 'You do not have permission to manage club moderators' });
      }
      
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing required field: userId' });
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
      
      // Check if the user is a member of the club
      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single();
        
      if (memberError || !memberData) {
        return res.status(400).json({ error: 'User must be a member of the club to be a moderator' });
      }
      
      // Add the moderator
      const { data, error } = await supabase
        .from('club_moderators')
        .insert({
          club_id: clubId,
          user_id: userId,
          assigned_by_user_id: currentUser.id
        })
        .select()
        .single();
        
      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          return res.status(409).json({ error: 'User is already a moderator for this club' });
        }
        
        return res.status(500).json({ error: 'Failed to add moderator' });
      }
      
      return res.status(201).json({ 
        message: 'Moderator added successfully',
        moderator: data
      });
    }
    
    // Handle DELETE request - remove a moderator
    if (req.method === 'DELETE') {
      // Check if the current user can manage the club
      if (!canManageClub(entitlements, clubId, storeId)) {
        return res.status(403).json({ error: 'You do not have permission to manage club moderators' });
      }
      
      const { userId } = req.query;
      
      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'Invalid userId' });
      }
      
      // Remove the moderator
      const { error } = await supabase
        .from('club_moderators')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId);
        
      if (error) {
        return res.status(500).json({ error: 'Failed to remove moderator' });
      }
      
      return res.status(200).json({ 
        message: 'Moderator removed successfully'
      });
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in club moderators API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
