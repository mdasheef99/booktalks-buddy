/**
 * Book Club Permissions
 * 
 * This module provides functions for checking permissions related to book clubs.
 */

import { supabase } from '@/lib/supabase';
import { hasContextualEntitlement } from '@/lib/entitlements';

/**
 * Check if a user is the lead of a club
 * 
 * @param userId The ID of the user to check
 * @param clubId The ID of the club to check
 * @returns True if the user is the lead of the club, false otherwise
 */
export async function isClubLead(userId: string, clubId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('book_clubs')
      .select('lead_user_id')
      .eq('id', clubId)
      .single();
      
    if (error) {
      console.error('Error checking club lead status:', error);
      return false;
    }
    
    return data.lead_user_id === userId;
  } catch (error) {
    console.error('Unexpected error checking club lead status:', error);
    return false;
  }
}

/**
 * Check if a user has store admin permissions for a club
 * 
 * @param entitlements The user's entitlements array
 * @param clubId The ID of the club to check
 * @returns True if the user has store admin permissions for the club, false otherwise
 */
export async function hasStoreAdminPermission(entitlements: string[], clubId: string): Promise<boolean> {
  try {
    // Get the store ID for this club
    const { data, error } = await supabase
      .from('book_clubs')
      .select('store_id')
      .eq('id', clubId)
      .single();
      
    if (error) {
      console.error('Error getting club store:', error);
      return false;
    }
    
    // Check if the user has store owner or manager entitlements for this store
    return hasContextualEntitlement(entitlements, 'STORE_OWNER', data.store_id) ||
           hasContextualEntitlement(entitlements, 'STORE_MANAGER', data.store_id);
  } catch (error) {
    console.error('Unexpected error checking store admin permission:', error);
    return false;
  }
}

/**
 * Check if a user can manage a specific club
 * 
 * This function checks if the user:
 * 1. Is the club lead
 * 2. Has store admin permissions for the club's store
 * 
 * @param userId The ID of the user to check
 * @param clubId The ID of the club to check
 * @param entitlements The user's entitlements array
 * @returns True if the user can manage the club, false otherwise
 */
export async function canManageSpecificClub(
  userId: string,
  clubId: string,
  entitlements: string[]
): Promise<boolean> {
  try {
    // Check if user is the club lead
    const isLead = await isClubLead(userId, clubId);
    
    // If user is the lead, they can manage the club
    if (isLead) {
      return true;
    }
    
    // Check if user has store admin permissions
    const isStoreAdmin = await hasStoreAdminPermission(entitlements, clubId);
    
    return isStoreAdmin;
  } catch (error) {
    console.error('Unexpected error checking club management permission:', error);
    return false;
  }
}
