/**
 * Club Members Service
 *
 * Handles all member-related operations for club management.
 * Provides member data fetching, filtering, and management operations.
 */

import { supabase } from '@/lib/supabase';
import { ClubManagementAPIError } from '@/lib/api/clubManagement';
import { clubCacheService, CacheKeys, CacheExpiry, withCache } from './clubCacheService';

// =====================================================
// Types
// =====================================================

export interface ClubMember {
  id: string;
  username: string;
  display_name: string; // Note: maps to 'displayname' column in database
  avatar_url?: string;
  joined_at: string;
}

// =====================================================
// Members Service Class
// =====================================================

export class ClubMembersService {
  private static instance: ClubMembersService;

  static getInstance(): ClubMembersService {
    if (!ClubMembersService.instance) {
      ClubMembersService.instance = new ClubMembersService();
    }
    return ClubMembersService.instance;
  }

  // =====================================================
  // Core Member Methods
  // =====================================================

  /**
   * Get all club members with caching (Fixed to match OLD working pattern)
   */
  async getClubMembers(clubId: string, useCache: boolean = true): Promise<ClubMember[]> {
    const cacheKey = CacheKeys.members(clubId);

    return withCache(
      cacheKey,
      () => this.fetchClubMembers(clubId),
      CacheExpiry.LONG, // 10 minutes
      useCache
    );
  }

  /**
   * Get eligible members for moderator appointment (excludes existing moderators)
   */
  async getEligibleMembers(clubId: string): Promise<ClubMember[]> {
    const cacheKey = CacheKeys.eligibleMembers(clubId);

    return withCache(
      cacheKey,
      () => this.fetchEligibleMembers(clubId),
      CacheExpiry.MEDIUM, // 5 minutes
      true
    );
  }

  /**
   * Refresh member data (bypass cache)
   */
  async refreshMembers(clubId: string): Promise<ClubMember[]> {
    // Invalidate cache and fetch fresh data
    clubCacheService.invalidate(CacheKeys.members(clubId));
    clubCacheService.invalidate(CacheKeys.eligibleMembers(clubId));
    return this.getClubMembers(clubId, false);
  }

  /**
   * Get member count for a club
   */
  async getMemberCount(clubId: string): Promise<number> {
    try {
      const members = await this.getClubMembers(clubId);
      return members.length;
    } catch (error) {
      console.error('Error getting member count:', error);
      return 0;
    }
  }

  /**
   * Check if a user is a member of a club
   */
  async isMember(clubId: string, userId: string): Promise<boolean> {
    try {
      const members = await this.getClubMembers(clubId);
      return members.some(member => member.id === userId);
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  }

  /**
   * Get member by user ID
   */
  async getMemberById(clubId: string, userId: string): Promise<ClubMember | null> {
    try {
      const members = await this.getClubMembers(clubId);
      return members.find(member => member.id === userId) || null;
    } catch (error) {
      console.error('Error getting member by ID:', error);
      return null;
    }
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  /**
   * Fetch club members from database
   */
  private async fetchClubMembers(clubId: string): Promise<ClubMember[]> {
    try {
      // Step 1: Get club members (same as OLD system)
      const { data: membersData, error: membersError } = await supabase
        .from('club_members')
        .select('user_id, joined_at')
        .eq('club_id', clubId)
        .order('joined_at', { ascending: false });

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        return [];
      }

      // Step 2: Get user data separately (same as OLD system)
      const userIds = membersData.map(member => member.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, displayname')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Step 3: Manual merge (same as OLD system enrichWithUserData)
      const members: ClubMember[] = membersData.map(member => {
        const userData = usersData?.find(user => user.id === member.user_id);

        return {
          id: member.user_id,
          username: userData?.username || '',
          display_name: userData?.displayname || userData?.username || 'Unknown User',
          avatar_url: undefined, // avatar_url column doesn't exist in users table
          joined_at: member.joined_at
        };
      });

      return members;
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to fetch club members',
        'MEMBERS_FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Fetch eligible members (non-moderators) from database
   */
  private async fetchEligibleMembers(clubId: string): Promise<ClubMember[]> {
    try {
      const [members, moderators] = await Promise.all([
        this.getClubMembers(clubId),
        this.getModerators(clubId)
      ]);

      const moderatorUserIds = new Set(
        moderators
          .filter(mod => mod.is_active)
          .map(mod => mod.user_id)
      );

      return members.filter(member => !moderatorUserIds.has(member.id));
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to fetch eligible members',
        'ELIGIBLE_MEMBERS_ERROR',
        error
      );
    }
  }

  /**
   * Get moderators (imported to avoid circular dependency)
   */
  private async getModerators(clubId: string) {
    // Import here to avoid circular dependency
    const { clubModeratorsService } = await import('./clubModeratorsService');
    return clubModeratorsService.getModerators(clubId);
  }

  // =====================================================
  // Cache Management
  // =====================================================

  /**
   * Clear member cache for a specific club
   */
  clearMemberCache(clubId: string): void {
    clubCacheService.invalidate(CacheKeys.members(clubId));
    clubCacheService.invalidate(CacheKeys.eligibleMembers(clubId));
  }

  /**
   * Clear all member cache
   */
  clearAllMemberCache(): void {
    clubCacheService.invalidate('members:');
    clubCacheService.invalidate('eligible:');
  }

  /**
   * Invalidate member-related caches when moderators change
   */
  invalidateOnModeratorChange(clubId: string): void {
    clubCacheService.invalidate(CacheKeys.eligibleMembers(clubId));
    // Don't invalidate members cache as member list doesn't change when moderators change
  }
}

// =====================================================
// Export singleton instance
// =====================================================

export const clubMembersService = ClubMembersService.getInstance();

// =====================================================
// Export types for external use
// =====================================================

export type { ClubMember };
