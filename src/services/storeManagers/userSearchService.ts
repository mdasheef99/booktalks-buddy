/**
 * User Search Service for Store Manager Appointment
 * 
 * Specialized service for handling user search functionality specific to
 * Store Manager appointment, including filtering and validation
 */

import { supabase } from '@/lib/supabase';
import type { StoreManagerCandidate } from '@/types/storeManagers';

// =========================
// Search Configuration
// =========================

const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_RESULTS: 50,
  DEBOUNCE_DELAY: 300
} as const;

// =========================
// Validation Functions
// =========================

const validateSearchParams = (storeId: string, searchTerm?: string) => {
  if (!storeId || typeof storeId !== 'string') {
    throw new Error('Valid store ID is required');
  }
  
  if (searchTerm && searchTerm.length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
    throw new Error(`Search term must be at least ${SEARCH_CONFIG.MIN_SEARCH_LENGTH} characters`);
  }
};

// =========================
// User Search Service
// =========================

export class UserSearchService {
  /**
   * Search for users eligible for Store Manager appointment within a specific store
   */
  static async searchStoreMembers(
    storeId: string,
    searchTerm: string = '',
    excludeUserIds: string[] = []
  ): Promise<StoreManagerCandidate[]> {
    try {
      validateSearchParams(storeId, searchTerm);

      // If search term is too short, return empty results
      if (searchTerm && searchTerm.length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
        return [];
      }

      // Get club members for this store first
      const { data: clubMembers, error: membersError } = await supabase
        .from('club_members')
        .select(`
          user_id,
          book_clubs!inner (
            store_id,
            name
          )
        `)
        .eq('book_clubs.store_id', storeId);

      if (membersError) {
        console.error('Error fetching club members:', membersError);
        throw new Error('Failed to search store members');
      }

      if (!clubMembers || clubMembers.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(clubMembers.map(member => member.user_id))];

      // Get user details separately to avoid foreign key issues
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, email, displayname, avatar_thumbnail_url, membership_tier, created_at, account_status, deleted_at')
        .in('id', userIds)
        .is('deleted_at', null) // Exclude deleted users
        .neq('account_status', 'banned'); // Exclude banned users

      if (usersError) {
        console.error('Error fetching user details:', usersError);
        throw new Error('Failed to fetch user details');
      }

      if (!users || users.length === 0) {
        return [];
      }

      // Process results and remove duplicates
      const uniqueUsers = new Map<string, StoreManagerCandidate>();
      const excludeSet = new Set(excludeUserIds);

      users.forEach(user => {
        // Skip if user should be excluded
        if (excludeSet.has(user.id) || uniqueUsers.has(user.id)) {
          return;
        }

        // Skip if user doesn't match search criteria
        if (searchTerm && !this.matchesSearchTerm(user, searchTerm)) {
          return;
        }

        uniqueUsers.set(user.id, {
          id: user.id,
          username: user.username,
          email: user.email,
          displayname: user.displayname,
          avatar_thumbnail_url: user.avatar_thumbnail_url,
          membership_tier: user.membership_tier,
          created_at: user.created_at
        });
      });

      // Convert to array and sort
      let candidates = Array.from(uniqueUsers.values());
      
      // Sort by relevance (exact matches first, then alphabetical)
      if (searchTerm) {
        candidates = this.sortByRelevance(candidates, searchTerm);
      } else {
        candidates.sort((a, b) => a.username.localeCompare(b.username));
      }

      // Limit results
      return candidates.slice(0, SEARCH_CONFIG.MAX_RESULTS);

    } catch (error) {
      console.error('User search error:', error);
      throw error;
    }
  }

  /**
   * Check if a user matches the search term
   */
  private static matchesSearchTerm(user: any, searchTerm: string): boolean {
    const searchLower = searchTerm.toLowerCase();
    
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.displayname && user.displayname.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Sort candidates by search relevance
   */
  private static sortByRelevance(
    candidates: StoreManagerCandidate[], 
    searchTerm: string
  ): StoreManagerCandidate[] {
    const searchLower = searchTerm.toLowerCase();
    
    return candidates.sort((a, b) => {
      // Exact username matches first
      const aUsernameExact = a.username.toLowerCase() === searchLower;
      const bUsernameExact = b.username.toLowerCase() === searchLower;
      if (aUsernameExact && !bUsernameExact) return -1;
      if (!aUsernameExact && bUsernameExact) return 1;

      // Username starts with search term
      const aUsernameStarts = a.username.toLowerCase().startsWith(searchLower);
      const bUsernameStarts = b.username.toLowerCase().startsWith(searchLower);
      if (aUsernameStarts && !bUsernameStarts) return -1;
      if (!aUsernameStarts && bUsernameStarts) return 1;

      // Display name exact matches
      const aDisplayExact = a.displayname?.toLowerCase() === searchLower;
      const bDisplayExact = b.displayname?.toLowerCase() === searchLower;
      if (aDisplayExact && !bDisplayExact) return -1;
      if (!aDisplayExact && bDisplayExact) return 1;

      // Display name starts with search term
      const aDisplayStarts = a.displayname?.toLowerCase().startsWith(searchLower);
      const bDisplayStarts = b.displayname?.toLowerCase().startsWith(searchLower);
      if (aDisplayStarts && !bDisplayStarts) return -1;
      if (!aDisplayStarts && bDisplayStarts) return 1;

      // Email starts with search term
      const aEmailStarts = a.email.toLowerCase().startsWith(searchLower);
      const bEmailStarts = b.email.toLowerCase().startsWith(searchLower);
      if (aEmailStarts && !bEmailStarts) return -1;
      if (!aEmailStarts && bEmailStarts) return 1;

      // Alphabetical fallback
      return a.username.localeCompare(b.username);
    });
  }

  /**
   * Get user details for appointment confirmation
   */
  static async getUserDetails(userId: string): Promise<StoreManagerCandidate | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          displayname,
          avatar_thumbnail_url,
          membership_tier,
          created_at
        `)
        .eq('id', userId)
        .is('deleted_at', null)
        .single();

      if (error || !user) {
        console.error('Error fetching user details:', error);
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayname: user.displayname,
        avatar_thumbnail_url: user.avatar_thumbnail_url,
        membership_tier: user.membership_tier,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      return null;
    }
  }

  /**
   * Validate that a user belongs to the specified store
   */
  static async validateUserStoreAccess(userId: string, storeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('user_id', userId)
        .eq('book_clubs.store_id', storeId)
        .limit(1);

      if (error) {
        console.error('Error validating user store access:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error validating user store access:', error);
      return false;
    }
  }
}

// =========================
// Export utilities
// =========================

export const userSearchUtils = {
  validateSearchTerm: (searchTerm: string): boolean => {
    return searchTerm.length >= SEARCH_CONFIG.MIN_SEARCH_LENGTH;
  },
  
  getSearchConfig: () => SEARCH_CONFIG,
  
  formatUserDisplayName: (user: StoreManagerCandidate): string => {
    return user.displayname || user.username;
  },
  
  getUserInitials: (user: StoreManagerCandidate): string => {
    const name = user.displayname || user.username;
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
};

export default UserSearchService;
