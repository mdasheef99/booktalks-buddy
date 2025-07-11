/**
 * Store Resolution Module
 * 
 * Store lookup and availability logic
 */

import { supabase, apiCall } from '@/lib/supabase';
import { AvailableStore } from './types/storeRequests';
import { validateStoreId, throwIfInvalid } from '@/lib/api/books/validation';

// =====================================================
// Store Resolution Functions
// =====================================================

/**
 * Get available stores for book requests
 */
export async function getAvailableStores(): Promise<AvailableStore[]> {
  try {
    const result = await apiCall<AvailableStore[]>(
      supabase
        .from('stores')
        .select('id, name')
        .order('name'),
      'Failed to load available stores'
    );

    return result || [];
    
  } catch (error) {
    console.error("Error fetching available stores:", error);
    return [];
  }
}

/**
 * Get store details by ID
 */
export async function getStoreById(storeId: string): Promise<{
  id: string;
  name: string;
  email?: string;
  address?: string;
} | null> {
  try {
    throwIfInvalid(validateStoreId(storeId), 'storeId');

    const result = await apiCall<{
      id: string;
      name: string;
      email?: string;
      address?: string;
    }>(
      supabase
        .from('stores')
        .select('id, name, email, address')
        .eq('id', storeId)
        .single(),
      'Failed to load store details'
    );

    return result;
    
  } catch (error) {
    console.error("Error fetching store details:", error);
    return null;
  }
}

/**
 * Check if store exists and is active
 */
export async function validateStoreExists(storeId: string): Promise<boolean> {
  try {
    const store = await getStoreById(storeId);
    return store !== null;
  } catch (error) {
    console.error("Error validating store existence:", error);
    return false;
  }
}

/**
 * Get stores by club association
 */
export async function getStoresByClub(clubId: string): Promise<AvailableStore[]> {
  try {
    const result = await apiCall<AvailableStore[]>(
      supabase
        .from('book_clubs')
        .select(`
          stores!inner(
            id,
            name
          )
        `)
        .eq('id', clubId),
      'Failed to load club stores'
    );

    return result?.map(item => item.stores).filter(Boolean) || [];
    
  } catch (error) {
    console.error("Error fetching stores by club:", error);
    return [];
  }
}

/**
 * Search stores by name
 */
export async function searchStores(searchTerm: string, limit: number = 10): Promise<AvailableStore[]> {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    const result = await apiCall<AvailableStore[]>(
      supabase
        .from('stores')
        .select('id, name')
        .ilike('name', `%${searchTerm.trim()}%`)
        .order('name')
        .limit(limit),
      'Failed to search stores'
    );

    return result || [];
    
  } catch (error) {
    console.error("Error searching stores:", error);
    return [];
  }
}

/**
 * Get store statistics
 */
export async function getStoreStats(storeId: string): Promise<{
  totalRequests: number;
  pendingRequests: number;
  respondedRequests: number;
  totalClubs: number;
  totalMembers: number;
} | null> {
  try {
    throwIfInvalid(validateStoreId(storeId), 'storeId');

    // Get request counts
    const { data: requestData, error: requestError } = await supabase
      .from('book_availability_requests')
      .select('status')
      .eq('store_id', storeId);

    if (requestError) {
      console.error('Error fetching request stats:', requestError);
      return null;
    }

    // Get club and member counts
    const { data: clubData, error: clubError } = await supabase
      .from('book_clubs')
      .select(`
        id,
        club_members(count)
      `)
      .eq('store_id', storeId);

    if (clubError) {
      console.error('Error fetching club stats:', clubError);
      return null;
    }

    const requests = requestData || [];
    const clubs = clubData || [];

    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      respondedRequests: requests.filter(r => r.status !== 'pending').length,
      totalClubs: clubs.length,
      totalMembers: clubs.reduce((sum, club) => sum + (club.club_members?.[0]?.count || 0), 0)
    };
    
  } catch (error) {
    console.error("Error fetching store statistics:", error);
    return null;
  }
}

/**
 * Check store availability for requests
 */
export async function isStoreAcceptingRequests(storeId: string): Promise<boolean> {
  try {
    const store = await getStoreById(storeId);
    // For now, all existing stores accept requests
    // This can be extended with store-specific settings
    return store !== null;
  } catch (error) {
    console.error("Error checking store availability:", error);
    return false;
  }
}
