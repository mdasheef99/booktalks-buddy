/**
 * Member Spotlight API Module
 * Handles all member spotlight related operations
 */

import { supabase } from '@/lib/supabase';
import type {
  MemberSpotlight,
  MemberSpotlightFormData,
  StoreUser
} from '../types/communityShowcaseTypes';
import {
  TABLE_NAMES,
  QUERY_SELECTORS,
  QUERY_LIMITS,
  ERROR_MESSAGES
} from '../constants/communityShowcaseConstants';
import {
  getCurrentISOString,
  buildSpotlightDateFilter,
  validateStoreId,
  logErrorWithContext
} from '../utils/communityShowcaseUtils';

/**
 * Member Spotlight API operations
 */
export class MemberSpotlightAPI {
  /**
   * Get active member spotlights with user data
   */
  static async getActiveSpotlights(storeId: string): Promise<MemberSpotlight[]> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const now = getCurrentISOString();

    // First, get the spotlight records
    const { data: spotlights, error } = await supabase
      .from(TABLE_NAMES.STORE_COMMUNITY_SHOWCASE)
      .select(QUERY_SELECTORS.MEMBER_SPOTLIGHT_WITH_USER)
      .eq('store_id', storeId)
      .eq('show_member_spotlights', true)
      .not('featured_member_id', 'is', null)
      .or(buildSpotlightDateFilter(now))
      .order('spotlight_start_date', { ascending: false })
      .limit(QUERY_LIMITS.DEFAULT_SPOTLIGHTS);

    if (error) {
      logErrorWithContext('getActiveSpotlights', error);
      throw new Error(ERROR_MESSAGES.FETCH_SPOTLIGHTS);
    }

    if (!spotlights || spotlights.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(spotlights.map(s => s.featured_member_id))];

    // Fetch user data from the users table (not auth.users)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, displayname, membership_tier, created_at')
      .in('id', userIds);

    if (usersError) {
      logErrorWithContext('getActiveSpotlights - users fetch', usersError);
      // Return spotlights without user data rather than failing completely
      return spotlights.map(spotlight => ({
        ...spotlight,
        userData: {
          username: 'Unknown User',
          displayname: 'Unknown User',
          membership_tier: 'MEMBER',
          created_at: new Date().toISOString()
        }
      }));
    }

    // Combine spotlight data with user data
    const usersMap = new Map(users?.map(user => [user.id, user]) || []);

    return spotlights.map(spotlight => ({
      ...spotlight,
      userData: usersMap.get(spotlight.featured_member_id) || {
        username: 'Unknown User',
        displayname: 'Unknown User',
        account_tier: 'free',
        created_at: new Date().toISOString()
      }
    }));
  }

  /**
   * Create a new member spotlight
   */
  static async createMemberSpotlight(storeId: string, spotlightData: MemberSpotlightFormData): Promise<MemberSpotlight> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    // Insert the spotlight record
    const { data: spotlight, error } = await supabase
      .from(TABLE_NAMES.STORE_COMMUNITY_SHOWCASE)
      .insert({
        store_id: storeId,
        ...spotlightData,
        show_member_spotlights: true,
      })
      .select('*')
      .single();

    if (error) {
      logErrorWithContext('createMemberSpotlight', error);
      throw new Error(ERROR_MESSAGES.CREATE_SPOTLIGHT);
    }

    // Fetch user data separately
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, displayname, membership_tier, created_at')
      .eq('id', spotlightData.featured_member_id)
      .single();

    if (userError) {
      logErrorWithContext('createMemberSpotlight - user fetch', userError);
      // Return spotlight with default user data
      return {
        ...spotlight,
        userData: {
          username: 'Unknown User',
          displayname: 'Unknown User',
          membership_tier: 'MEMBER',
          created_at: new Date().toISOString()
        }
      };
    }

    return {
      ...spotlight,
      userData
    };
  }

  /**
   * Update member spotlight
   */
  static async updateMemberSpotlight(
    storeId: string,
    spotlightId: string,
    updates: Partial<MemberSpotlightFormData>
  ): Promise<void> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const { error } = await supabase
      .from(TABLE_NAMES.STORE_COMMUNITY_SHOWCASE)
      .update({
        ...updates,
        updated_at: getCurrentISOString(),
      })
      .eq('id', spotlightId)
      .eq('store_id', storeId);

    if (error) {
      logErrorWithContext('updateMemberSpotlight', error);
      throw new Error(ERROR_MESSAGES.UPDATE_SPOTLIGHT);
    }
  }

  /**
   * Delete member spotlight
   */
  static async deleteMemberSpotlight(storeId: string, spotlightId: string): Promise<void> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const { error } = await supabase
      .from(TABLE_NAMES.STORE_COMMUNITY_SHOWCASE)
      .delete()
      .eq('id', spotlightId)
      .eq('store_id', storeId);

    if (error) {
      logErrorWithContext('deleteMemberSpotlight', error);
      throw new Error(ERROR_MESSAGES.DELETE_SPOTLIGHT);
    }
  }

  /**
   * Search store members for spotlight selection
   * Uses the proven admin users section pattern with direct table access
   */
  static async searchStoreMembers(storeId: string, searchTerm: string = ''): Promise<StoreUser[]> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    try {
      // Step 1: Get ALL users using direct table access (like admin section)
      // This works because of the emergency RLS policy: "Allow authenticated users to view all profiles"
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, username, displayname, membership_tier, created_at')
        .order('username');

      if (usersError) {
        logErrorWithContext('searchStoreMembers - users fetch', usersError);
        throw new Error(ERROR_MESSAGES.SEARCH_MEMBERS);
      }

      if (!allUsers || allUsers.length === 0) {
        return [];
      }

      // Step 2: Get store club IDs (simple query)
      const { data: storeClubs, error: clubsError } = await supabase
        .from(TABLE_NAMES.BOOK_CLUBS)
        .select('id')
        .eq('store_id', storeId);

      if (clubsError) {
        logErrorWithContext('searchStoreMembers - clubs fetch', clubsError);
        throw new Error(ERROR_MESSAGES.SEARCH_MEMBERS);
      }

      if (!storeClubs || storeClubs.length === 0) {
        return []; // No clubs in this store
      }

      const clubIds = storeClubs.map(club => club.id);

      // Step 3: Get club members (simple query)
      const { data: clubMembers, error: membersError } = await supabase
        .from(TABLE_NAMES.CLUB_MEMBERS)
        .select('user_id, joined_at')
        .in('club_id', clubIds);

      if (membersError) {
        logErrorWithContext('searchStoreMembers - members fetch', membersError);
        throw new Error(ERROR_MESSAGES.SEARCH_MEMBERS);
      }

      if (!clubMembers || clubMembers.length === 0) {
        return []; // No members in store clubs
      }

      // Step 4: Create member user ID set and join date map
      const memberUserIds = new Set<string>();
      const userJoinMap = new Map<string, string>();

      clubMembers.forEach(member => {
        memberUserIds.add(member.user_id);
        const existingJoinDate = userJoinMap.get(member.user_id);
        if (!existingJoinDate || member.joined_at < existingJoinDate) {
          userJoinMap.set(member.user_id, member.joined_at);
        }
      });

      // Step 5: Filter users to only store members and apply search
      let storeMembers = allUsers.filter(user => memberUserIds.has(user.id));

      // Step 6: Apply client-side search filtering (like admin section)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        storeMembers = storeMembers.filter(user =>
          (user.username && user.username.toLowerCase().includes(searchLower)) ||
          (user.displayname && user.displayname.toLowerCase().includes(searchLower))
        );
      }

      // Step 7: Transform to StoreUser format
      const result: StoreUser[] = storeMembers.map(user => ({
        id: user.id,
        username: user.username || '',
        displayname: user.displayname || undefined,
        membership_tier: user.membership_tier || 'MEMBER',
        created_at: user.created_at || '',
        first_joined: userJoinMap.get(user.id) || user.created_at || ''
      }));

      return result;

    } catch (error) {
      logErrorWithContext('searchStoreMembers - general error', error);
      throw new Error(ERROR_MESSAGES.SEARCH_MEMBERS);
    }
  }
}
