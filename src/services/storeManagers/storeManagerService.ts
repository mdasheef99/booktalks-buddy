/**
 * Store Manager Service
 * 
 * Business logic layer for Store Manager operations including appointment,
 * removal, and management functionality
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  StoreManager, 
  StoreManagerCandidate,
  StoreManagerService as IStoreManagerService,
  StoreManagerError 
} from '@/types/storeManagers';

// =========================
// Error Handling
// =========================

class StoreManagerServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StoreManagerServiceError';
  }
}

const handleServiceError = (error: any, operation: string): never => {
  console.error(`Store Manager Service Error (${operation}):`, error);
  
  if (error instanceof StoreManagerServiceError) {
    throw error;
  }
  
  // Map common Supabase errors
  if (error.code === 'PGRST116') {
    throw new StoreManagerServiceError(
      'NOT_FOUND',
      'Resource not found',
      error
    );
  }
  
  if (error.code === '23505') {
    throw new StoreManagerServiceError(
      'USER_ALREADY_MANAGER',
      'User is already a Store Manager',
      error
    );
  }
  
  throw new StoreManagerServiceError(
    'UNKNOWN_ERROR',
    `Failed to ${operation}: ${error.message}`,
    error
  );
};

// =========================
// Store Manager Service Implementation
// =========================

export const storeManagerService: IStoreManagerService = {
  /**
   * Get all Store Managers for a specific store
   */
  async getStoreManagers(storeId: string): Promise<StoreManager[]> {
    try {
      if (!storeId) {
        throw new StoreManagerServiceError('INVALID_STORE_ID', 'Store ID is required');
      }

      // Get store administrators first
      const { data: administrators, error } = await supabase
        .from('store_administrators')
        .select('user_id, store_id, role, assigned_at, assigned_by')
        .eq('store_id', storeId)
        .eq('role', 'manager')
        .order('assigned_at', { ascending: false });

      if (error) {
        handleServiceError(error, 'fetch Store Managers');
      }

      if (!administrators || administrators.length === 0) {
        return [];
      }

      // Get user details separately to avoid foreign key issues
      const userIds = administrators.map(admin => admin.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, email, displayname, avatar_thumbnail_url')
        .in('id', userIds);

      if (usersError) {
        console.warn('Could not fetch user details, using basic info:', usersError);
      }

      // Combine the data
      const managers: StoreManager[] = administrators.map(admin => {
        const user = users?.find(u => u.id === admin.user_id);
        return {
          user_id: admin.user_id,
          store_id: admin.store_id,
          role: admin.role as 'manager',
          assigned_at: admin.assigned_at,
          assigned_by: admin.assigned_by,
          users: {
            username: user?.username || 'Unknown User',
            email: user?.email || '',
            displayname: user?.displayname,
            avatar_thumbnail_url: user?.avatar_thumbnail_url
          }
        };
      });

      return managers;
    } catch (error) {
      handleServiceError(error, 'fetch Store Managers');
    }
  },

  /**
   * Appoint a user as Store Manager
   */
  async appointStoreManager(storeId: string, userId: string): Promise<void> {
    try {
      if (!storeId || !userId) {
        throw new StoreManagerServiceError(
          'INVALID_PARAMETERS',
          'Store ID and User ID are required'
        );
      }

      // Get current user for assigned_by field
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new StoreManagerServiceError(
          'UNAUTHORIZED',
          'Authentication required'
        );
      }

      // Check if user exists and belongs to the store
      const { data: userCheck, error: userError } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('id', userId)
        .single();

      if (userError || !userCheck) {
        throw new StoreManagerServiceError(
          'USER_NOT_FOUND',
          'User not found or not accessible'
        );
      }

      // Verify user belongs to store through club membership
      const { data: membershipCheck, error: membershipError } = await supabase
        .from('club_members')
        .select(`
          user_id,
          book_clubs!inner(store_id)
        `)
        .eq('user_id', userId)
        .eq('book_clubs.store_id', storeId)
        .limit(1);

      if (membershipError || !membershipCheck || membershipCheck.length === 0) {
        throw new StoreManagerServiceError(
          'USER_NOT_IN_STORE',
          'User is not a member of any clubs in this store'
        );
      }

      // Insert Store Manager record
      const { error: insertError } = await supabase
        .from('store_administrators')
        .insert({
          store_id: storeId,
          user_id: userId,
          role: 'manager',
          assigned_by: user.id
        });

      if (insertError) {
        handleServiceError(insertError, 'appoint Store Manager');
      }

      toast.success(`Successfully appointed ${userCheck.username} as Store Manager`);
    } catch (error) {
      const errorMessage = error instanceof StoreManagerServiceError 
        ? error.message 
        : 'Failed to appoint Store Manager';
      
      toast.error(errorMessage);
      handleServiceError(error, 'appoint Store Manager');
    }
  },

  /**
   * Remove Store Manager privileges from a user
   */
  async removeStoreManager(storeId: string, userId: string): Promise<void> {
    try {
      if (!storeId || !userId) {
        throw new StoreManagerServiceError(
          'INVALID_PARAMETERS',
          'Store ID and User ID are required'
        );
      }

      // Get user info for confirmation message
      const { data: userInfo, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('store_administrators')
        .delete()
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .eq('role', 'manager');

      if (error) {
        handleServiceError(error, 'remove Store Manager');
      }

      const username = userInfo?.username || 'User';
      toast.success(`Successfully removed ${username} from Store Manager role`);
    } catch (error) {
      const errorMessage = error instanceof StoreManagerServiceError 
        ? error.message 
        : 'Failed to remove Store Manager';
      
      toast.error(errorMessage);
      handleServiceError(error, 'remove Store Manager');
    }
  },

  /**
   * Search for users eligible for Store Manager appointment
   */
  async searchUsersForAppointment(
    storeId: string, 
    searchTerm: string = ''
  ): Promise<StoreManagerCandidate[]> {
    try {
      if (!storeId) {
        throw new StoreManagerServiceError('INVALID_STORE_ID', 'Store ID is required');
      }

      // Get existing Store Managers to exclude them
      const existingManagers = await this.getStoreManagers(storeId);
      const managerIds = new Set(existingManagers.map(m => m.user_id));

      // Get all users who are members of clubs in this store
      const { data: storeMembers, error } = await supabase
        .from('club_members')
        .select(`
          user_id,
          users!inner (
            id,
            username,
            email,
            displayname,
            avatar_thumbnail_url,
            membership_tier,
            created_at
          ),
          book_clubs!inner (
            store_id
          )
        `)
        .eq('book_clubs.store_id', storeId);

      if (error) {
        handleServiceError(error, 'search users for appointment');
      }

      // Process and filter results
      const uniqueUsers = new Map<string, StoreManagerCandidate>();
      
      storeMembers?.forEach(member => {
        const user = member.users;
        if (!managerIds.has(user.id) && !uniqueUsers.has(user.id)) {
          uniqueUsers.set(user.id, {
            id: user.id,
            username: user.username,
            email: user.email,
            displayname: user.displayname,
            avatar_thumbnail_url: user.avatar_thumbnail_url,
            membership_tier: user.membership_tier,
            created_at: user.created_at
          });
        }
      });

      let candidates = Array.from(uniqueUsers.values());

      // Apply search filter if provided
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        candidates = candidates.filter(user =>
          user.username.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.displayname && user.displayname.toLowerCase().includes(searchLower))
        );
      }

      // Sort by username
      candidates.sort((a, b) => a.username.localeCompare(b.username));

      return candidates;
    } catch (error) {
      handleServiceError(error, 'search users for appointment');
    }
  }
};

// =========================
// Export default service
// =========================

export default storeManagerService;
