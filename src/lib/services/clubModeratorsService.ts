/**
 * Club Moderators Service
 *
 * Handles all moderator-related operations for club management.
 * Provides moderator appointment, permission management, and data operations.
 */

import { supabase } from '@/lib/supabase';
import {
  getClubModerators,
  updateModeratorPermissions,
  toggleModeratorAnalytics,
  ClubModerator,
  ClubManagementAPIError
} from '@/lib/api/clubManagement';
import { clubCacheService, CacheKeys, CacheExpiry, withCache } from './clubCacheService';

// =====================================================
// Types
// =====================================================

export interface ModeratorAppointmentRequest {
  clubId: string;
  userId: string;
  appointedBy: string;
  defaultPermissions: {
    analytics_access: boolean;
    content_moderation_access: boolean;
    member_management_access: boolean;
    meeting_management_access: boolean;
    customization_access: boolean;
  };
}

// =====================================================
// Moderators Service Class
// =====================================================

export class ClubModeratorsService {
  private static instance: ClubModeratorsService;

  static getInstance(): ClubModeratorsService {
    if (!ClubModeratorsService.instance) {
      ClubModeratorsService.instance = new ClubModeratorsService();
    }
    return ClubModeratorsService.instance;
  }

  // =====================================================
  // Core Moderator Methods
  // =====================================================

  /**
   * Get club moderators with caching
   */
  async getModerators(clubId: string, useCache: boolean = true): Promise<ClubModerator[]> {
    const cacheKey = CacheKeys.moderators(clubId);

    return withCache(
      cacheKey,
      () => this.fetchModerators(clubId),
      CacheExpiry.LONG, // 10 minutes
      useCache
    );
  }

  /**
   * Appoint a member as moderator
   */
  async appointModerator(request: ModeratorAppointmentRequest): Promise<ClubModerator> {
    try {
      // Verify the user is a club member
      const { clubMembersService } = await import('./clubMembersService');
      const isMember = await clubMembersService.isMember(request.clubId, request.userId);

      if (!isMember) {
        throw new ClubManagementAPIError(
          'User is not a member of this club',
          'NOT_CLUB_MEMBER'
        );
      }

      // Check if user is already a moderator
      const moderators = await this.getModerators(request.clubId);
      const isAlreadyModerator = moderators.some(
        mod => mod.user_id === request.userId && mod.is_active
      );

      if (isAlreadyModerator) {
        throw new ClubManagementAPIError(
          'User is already a moderator',
          'ALREADY_MODERATOR'
        );
      }

      // Insert new moderator record
      const { data, error } = await supabase
        .from('club_moderators')
        .insert({
          club_id: request.clubId,
          user_id: request.userId,
          appointed_by: request.appointedBy,
          role: 'moderator',
          is_active: true,
          analytics_access: request.defaultPermissions.analytics_access,
          content_moderation_access: request.defaultPermissions.content_moderation_access,
          member_management_access: request.defaultPermissions.member_management_access,
          meeting_management_access: request.defaultPermissions.meeting_management_access,
          customization_access: request.defaultPermissions.customization_access
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate relevant caches
      this.invalidateModeratorCaches(request.clubId);

      return data as ClubModerator;
    } catch (error) {
      if (error instanceof ClubManagementAPIError) {
        throw error;
      }
      throw new ClubManagementAPIError(
        'Failed to appoint moderator',
        'MODERATOR_APPOINTMENT_ERROR',
        error
      );
    }
  }

  /**
   * Update moderator permissions and invalidate cache
   */
  async updateModeratorPermissions(
    clubId: string,
    moderatorId: string,
    permissions: Partial<Pick<ClubModerator,
      'analytics_access' |
      'meeting_management_access' |
      'customization_access' |
      'content_moderation_access' |
      'member_management_access'
    >>
  ): Promise<ClubModerator> {
    try {
      const updatedModerator = await updateModeratorPermissions(clubId, moderatorId, permissions);

      // Invalidate moderators cache
      clubCacheService.invalidate(CacheKeys.moderators(clubId));

      return updatedModerator;
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to update moderator permissions',
        'MODERATOR_UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Toggle analytics access for moderator
   */
  async toggleAnalyticsAccess(
    clubId: string,
    moderatorId: string,
    enabled: boolean
  ): Promise<void> {
    try {
      await toggleModeratorAnalytics(clubId, moderatorId, enabled);

      // Invalidate moderators cache
      clubCacheService.invalidate(CacheKeys.moderators(clubId));
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to toggle analytics access',
        'ANALYTICS_TOGGLE_ERROR',
        error
      );
    }
  }

  /**
   * Remove a moderator (deactivate)
   */
  async removeModerator(clubId: string, moderatorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('club_moderators')
        .update({ is_active: false })
        .eq('id', moderatorId)
        .eq('club_id', clubId);

      if (error) throw error;

      // Invalidate relevant caches
      this.invalidateModeratorCaches(clubId);
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to remove moderator',
        'MODERATOR_REMOVAL_ERROR',
        error
      );
    }
  }

  /**
   * Get active moderators only
   */
  async getActiveModerators(clubId: string): Promise<ClubModerator[]> {
    const moderators = await this.getModerators(clubId);
    return moderators.filter(mod => mod.is_active);
  }

  /**
   * Check if user is a moderator of a club
   */
  async isModerator(clubId: string, userId: string): Promise<boolean> {
    try {
      const moderators = await this.getModerators(clubId);
      return moderators.some(mod => mod.user_id === userId && mod.is_active);
    } catch (error) {
      console.error('Error checking moderator status:', error);
      return false;
    }
  }

  /**
   * Get moderator by user ID
   */
  async getModeratorByUserId(clubId: string, userId: string): Promise<ClubModerator | null> {
    try {
      const moderators = await this.getModerators(clubId);
      return moderators.find(mod => mod.user_id === userId && mod.is_active) || null;
    } catch (error) {
      console.error('Error getting moderator by user ID:', error);
      return null;
    }
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  /**
   * Fetch moderators from API
   */
  private async fetchModerators(clubId: string): Promise<ClubModerator[]> {
    try {
      return await getClubModerators(clubId);
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to fetch club moderators',
        'MODERATORS_FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Invalidate all moderator-related caches
   */
  private invalidateModeratorCaches(clubId: string): void {
    clubCacheService.invalidate(CacheKeys.moderators(clubId));
    
    // Also invalidate eligible members cache since moderator changes affect it
    const { clubMembersService } = require('./clubMembersService');
    clubMembersService.invalidateOnModeratorChange(clubId);
  }

  // =====================================================
  // Cache Management
  // =====================================================

  /**
   * Clear moderator cache for a specific club
   */
  clearModeratorCache(clubId: string): void {
    clubCacheService.invalidate(CacheKeys.moderators(clubId));
  }

  /**
   * Clear all moderator cache
   */
  clearAllModeratorCache(): void {
    clubCacheService.invalidate('moderators:');
  }
}

// =====================================================
// Export singleton instance
// =====================================================

export const clubModeratorsService = ClubModeratorsService.getInstance();

// =====================================================
// Export types for external use
// =====================================================

export type { ClubModerator, ModeratorAppointmentRequest };
