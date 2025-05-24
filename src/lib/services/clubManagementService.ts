/**
 * Club Management Service (Refactored)
 *
 * Main service that orchestrates all club management operations.
 * This service maintains backward compatibility while delegating to specialized services.
 *
 * Architecture:
 * - clubCacheService: Centralized caching utilities
 * - clubAnalyticsService: Analytics operations
 * - clubMembersService: Member management
 * - clubModeratorsService: Moderator management
 */

// Import specialized services
import { clubCacheService } from './clubCacheService';
import { clubAnalyticsService, BasicClubAnalytics, ClubAnalyticsSnapshot } from './clubAnalyticsService';
import { clubMembersService, ClubMember } from './clubMembersService';
import { clubModeratorsService, ClubModerator, ModeratorAppointmentRequest } from './clubModeratorsService';
import { clubEventsService, ClubMeeting, CreateMeetingRequest, UpdateMeetingRequest, MeetingQueryOptions, ClubEventNotification, MeetingAnalytics } from './clubEventsService';

// Import types and errors for re-export
import { ClubManagementAPIError } from '@/lib/api/clubManagement';

// =====================================================
// Main Service Class (Delegation-based)
// =====================================================

export class ClubManagementService {
  private static instance: ClubManagementService;

  static getInstance(): ClubManagementService {
    if (!ClubManagementService.instance) {
      ClubManagementService.instance = new ClubManagementService();
    }
    return ClubManagementService.instance;
  }

  // =====================================================
  // Analytics Methods (Delegate to clubAnalyticsService)
  // =====================================================

  /**
   * Get club analytics with caching
   */
  async getAnalytics(clubId: string, useCache: boolean = true): Promise<BasicClubAnalytics> {
    return clubAnalyticsService.getAnalytics(clubId, useCache);
  }

  /**
   * Refresh analytics data
   */
  async refreshAnalytics(clubId: string): Promise<BasicClubAnalytics> {
    return clubAnalyticsService.refreshAnalytics(clubId);
  }

  /**
   * Get analytics snapshots with caching
   */
  async getAnalyticsHistory(
    clubId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 30
  ): Promise<ClubAnalyticsSnapshot[]> {
    return clubAnalyticsService.getAnalyticsHistory(clubId, startDate, endDate, limit);
  }

  /**
   * Create daily snapshot and invalidate cache
   */
  async createSnapshot(clubId: string): Promise<void> {
    return clubAnalyticsService.createSnapshot(clubId);
  }

  /**
   * Get analytics summary with error handling
   */
  async getAnalyticsSafe(clubId: string): Promise<BasicClubAnalytics | null> {
    return clubAnalyticsService.getAnalyticsSafe(clubId);
  }

  /**
   * Check if user has analytics access for a club
   */
  async hasAnalyticsAccess(clubId: string, userId: string): Promise<boolean> {
    return clubAnalyticsService.hasAnalyticsAccess(clubId, userId);
  }

  /**
   * Batch operations for multiple clubs
   */
  async batchCreateSnapshots(clubIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    return clubAnalyticsService.batchCreateSnapshots(clubIds);
  }

  // =====================================================
  // Moderator Management Methods (Delegate to clubModeratorsService)
  // =====================================================

  /**
   * Get club moderators with caching
   */
  async getModerators(clubId: string, useCache: boolean = true): Promise<ClubModerator[]> {
    return clubModeratorsService.getModerators(clubId, useCache);
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
    return clubModeratorsService.updateModeratorPermissions(clubId, moderatorId, permissions);
  }

  /**
   * Toggle analytics access for moderator
   */
  async toggleAnalyticsAccess(
    clubId: string,
    moderatorId: string,
    enabled: boolean
  ): Promise<void> {
    return clubModeratorsService.toggleAnalyticsAccess(clubId, moderatorId, enabled);
  }

  /**
   * Appoint a member as moderator
   */
  async appointModerator(request: ModeratorAppointmentRequest): Promise<ClubModerator> {
    return clubModeratorsService.appointModerator(request);
  }

  // =====================================================
  // Member Management Methods (Delegate to clubMembersService)
  // =====================================================

  /**
   * Get all club members with caching
   */
  async getClubMembers(clubId: string, useCache: boolean = true): Promise<ClubMember[]> {
    return clubMembersService.getClubMembers(clubId, useCache);
  }

  /**
   * Get eligible members for moderator appointment (excludes existing moderators)
   */
  async getEligibleMembers(clubId: string): Promise<ClubMember[]> {
    return clubMembersService.getEligibleMembers(clubId);
  }

  // =====================================================
  // Events/Meetings Management Methods (Delegate to clubEventsService)
  // =====================================================

  /**
   * Get club meetings with caching
   */
  async getMeetings(
    clubId: string,
    options: MeetingQueryOptions = {},
    useCache: boolean = true
  ): Promise<ClubMeeting[]> {
    return clubEventsService.getMeetings(clubId, options, useCache);
  }

  /**
   * Get a specific meeting
   */
  async getMeeting(
    clubId: string,
    meetingId: string,
    useCache: boolean = true
  ): Promise<ClubMeeting | null> {
    return clubEventsService.getMeeting(clubId, meetingId, useCache);
  }

  /**
   * Create a new meeting
   */
  async createMeeting(
    clubId: string,
    meetingData: CreateMeetingRequest,
    userId: string
  ): Promise<ClubMeeting> {
    return clubEventsService.createMeeting(clubId, meetingData, userId);
  }

  /**
   * Update a meeting
   */
  async updateMeeting(
    clubId: string,
    meetingId: string,
    updates: UpdateMeetingRequest
  ): Promise<ClubMeeting> {
    return clubEventsService.updateMeeting(clubId, meetingId, updates);
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(clubId: string, meetingId: string): Promise<void> {
    return clubEventsService.deleteMeeting(clubId, meetingId);
  }

  /**
   * Get meeting analytics
   */
  async getMeetingAnalytics(clubId: string, useCache: boolean = true): Promise<MeetingAnalytics> {
    return clubEventsService.getMeetingAnalytics(clubId, useCache);
  }

  /**
   * Get event notifications for a user
   */
  async getEventNotifications(
    clubId: string,
    userId: string,
    dismissed: boolean = false,
    useCache: boolean = true
  ): Promise<ClubEventNotification[]> {
    return clubEventsService.getNotifications(clubId, userId, dismissed, useCache);
  }

  /**
   * Dismiss an event notification
   */
  async dismissEventNotification(
    clubId: string,
    notificationId: string,
    userId: string
  ): Promise<void> {
    return clubEventsService.dismissNotification(clubId, notificationId, userId);
  }

  /**
   * Get events from main events system
   */
  async getClubEvents(clubId: string, useCache: boolean = true): Promise<any[]> {
    return clubEventsService.getClubEvents(clubId, useCache);
  }

  // =====================================================
  // RSVP Management Methods (Delegate to clubEventsService)
  // =====================================================

  /**
   * Create or update an RSVP for a meeting
   */
  async upsertRSVP(
    meetingId: string,
    clubId: string,
    userId: string,
    rsvpStatus: any
  ): Promise<any> {
    return clubEventsService.upsertRSVP(meetingId, clubId, userId, rsvpStatus);
  }

  /**
   * Get user's RSVP for a meeting
   */
  async getUserRSVP(
    meetingId: string,
    userId: string,
    useCache: boolean = true
  ): Promise<any> {
    return clubEventsService.getUserRSVP(meetingId, userId, useCache);
  }

  /**
   * Get RSVP statistics for a meeting
   */
  async getMeetingRSVPStats(
    meetingId: string,
    useCache: boolean = true
  ): Promise<any> {
    return clubEventsService.getMeetingRSVPStats(meetingId, useCache);
  }

  /**
   * Get all RSVPs for a meeting
   */
  async getMeetingRSVPs(
    meetingId: string,
    useCache: boolean = true
  ): Promise<any[]> {
    return clubEventsService.getMeetingRSVPs(meetingId, useCache);
  }

  /**
   * Delete an RSVP
   */
  async deleteRSVP(
    meetingId: string,
    userId: string,
    clubId: string
  ): Promise<void> {
    return clubEventsService.deleteRSVP(meetingId, userId, clubId);
  }

  /**
   * Get club-wide RSVP statistics
   */
  async getClubMeetingRSVPStats(
    clubId: string,
    useCache: boolean = true
  ): Promise<any[]> {
    return clubEventsService.getClubMeetingRSVPStats(clubId, useCache);
  }

  // =====================================================
  // Cache Management Methods (Delegate to clubCacheService)
  // =====================================================

  /**
   * Clear all cache for a specific club
   */
  clearClubCache(clubId: string): void {
    clubCacheService.invalidateClub(clubId);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    clubCacheService.invalidate();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return clubCacheService.getStats();
  }
}

// =====================================================
// Export singleton instance
// =====================================================

export const clubManagementService = ClubManagementService.getInstance();

// =====================================================
// Re-export types for backward compatibility
// =====================================================

export type {
  ClubMember,
  ClubModerator,
  ModeratorAppointmentRequest,
  BasicClubAnalytics,
  ClubAnalyticsSnapshot,
  ClubMeeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  MeetingQueryOptions,
  ClubEventNotification,
  MeetingAnalytics
};

// Re-export error class
export { ClubManagementAPIError } from '@/lib/api/clubManagement';

// =====================================================
// Re-export specialized services for direct access
// =====================================================

export {
  clubCacheService,
  clubAnalyticsService,
  clubMembersService,
  clubModeratorsService,
  clubEventsService
};
