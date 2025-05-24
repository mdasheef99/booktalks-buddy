/**
 * Club Events Service
 *
 * Handles all events/meetings-related operations for club management.
 * Provides caching, error handling, and data transformation for events data.
 */

import {
  createClubMeeting,
  getClubMeetings,
  getClubMeeting,
  updateClubMeeting,
  deleteClubMeeting,
  getClubMeetingAnalytics,
  getClubEventNotifications,
  dismissClubEventNotification,
  createMeetingNotification,
  getClubEvents,
  upsertMeetingRSVP,
  getUserMeetingRSVP,
  getMeetingRSVPs,
  getMeetingRSVPStats,
  getClubMeetingRSVPStats,
  deleteMeetingRSVP,
  ClubMeeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  MeetingQueryOptions,
  ClubEventNotification,
  MeetingAnalytics,
  ClubManagementAPIError,
  ClubMeetingRSVP,
  MeetingRSVPStats,
  RSVPStatus
} from '@/lib/api/clubManagement';
import { clubCacheService, CacheKeys, CacheExpiry, withCache } from './clubCacheService';

// =====================================================
// Events Service Class
// =====================================================

export class ClubEventsService {
  private static instance: ClubEventsService;

  static getInstance(): ClubEventsService {
    if (!ClubEventsService.instance) {
      ClubEventsService.instance = new ClubEventsService();
    }
    return ClubEventsService.instance;
  }

  // =====================================================
  // Core Meeting Methods
  // =====================================================

  /**
   * Get club meetings with caching
   */
  async getMeetings(
    clubId: string,
    options: MeetingQueryOptions = {},
    useCache: boolean = true
  ): Promise<ClubMeeting[]> {
    const cacheKey = CacheKeys.meetings(clubId, options);

    return withCache(
      cacheKey,
      () => this.fetchMeetings(clubId, options),
      CacheExpiry.MEDIUM, // 5 minutes
      useCache
    );
  }

  /**
   * Get a specific meeting with caching
   */
  async getMeeting(
    clubId: string,
    meetingId: string,
    useCache: boolean = true
  ): Promise<ClubMeeting | null> {
    const cacheKey = CacheKeys.meeting(clubId, meetingId);

    return withCache(
      cacheKey,
      () => this.fetchMeeting(clubId, meetingId),
      CacheExpiry.MEDIUM,
      useCache
    );
  }

  /**
   * Create a new meeting and invalidate cache
   */
  async createMeeting(
    clubId: string,
    meetingData: CreateMeetingRequest,
    userId: string
  ): Promise<ClubMeeting> {
    try {
      const meeting = await createClubMeeting(clubId, meetingData, userId);

      // Invalidate related caches
      this.invalidateMeetingCaches(clubId);

      return meeting;
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to create meeting',
        'MEETING_CREATE_ERROR',
        error
      );
    }
  }

  /**
   * Update a meeting and invalidate cache
   */
  async updateMeeting(
    clubId: string,
    meetingId: string,
    updates: UpdateMeetingRequest
  ): Promise<ClubMeeting> {
    try {
      const meeting = await updateClubMeeting(clubId, meetingId, updates);

      // Invalidate related caches
      this.invalidateMeetingCaches(clubId);
      clubCacheService.invalidate(CacheKeys.meeting(clubId, meetingId));

      return meeting;
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to update meeting',
        'MEETING_UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Delete a meeting and invalidate cache
   */
  async deleteMeeting(clubId: string, meetingId: string): Promise<void> {
    try {
      await deleteClubMeeting(clubId, meetingId);

      // Invalidate related caches
      this.invalidateMeetingCaches(clubId);
      clubCacheService.invalidate(CacheKeys.meeting(clubId, meetingId));
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to delete meeting',
        'MEETING_DELETE_ERROR',
        error
      );
    }
  }

  /**
   * Refresh meetings data (bypass cache)
   */
  async refreshMeetings(clubId: string, options: MeetingQueryOptions = {}): Promise<ClubMeeting[]> {
    // Invalidate cache and fetch fresh data
    this.invalidateMeetingCaches(clubId);
    return this.getMeetings(clubId, options, false);
  }

  // =====================================================
  // Analytics Methods
  // =====================================================

  /**
   * Get meeting analytics with caching
   */
  async getMeetingAnalytics(clubId: string, useCache: boolean = true): Promise<MeetingAnalytics> {
    const cacheKey = CacheKeys.meetingAnalytics(clubId);

    return withCache(
      cacheKey,
      () => this.fetchMeetingAnalytics(clubId),
      CacheExpiry.MEDIUM,
      useCache
    );
  }

  /**
   * Refresh meeting analytics (bypass cache)
   */
  async refreshMeetingAnalytics(clubId: string): Promise<MeetingAnalytics> {
    clubCacheService.invalidate(CacheKeys.meetingAnalytics(clubId));
    return this.getMeetingAnalytics(clubId, false);
  }

  // =====================================================
  // Notification Methods
  // =====================================================

  /**
   * Get event notifications with caching
   */
  async getNotifications(
    clubId: string,
    userId: string,
    dismissed: boolean = false,
    useCache: boolean = true
  ): Promise<ClubEventNotification[]> {
    const cacheKey = CacheKeys.notifications(clubId, userId, dismissed);

    return withCache(
      cacheKey,
      () => this.fetchNotifications(clubId, userId, dismissed),
      CacheExpiry.SHORT, // 2 minutes for notifications
      useCache
    );
  }

  /**
   * Dismiss notification and invalidate cache
   */
  async dismissNotification(
    clubId: string,
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      await dismissClubEventNotification(notificationId, userId);

      // Invalidate notification caches for this user
      clubCacheService.invalidate(CacheKeys.notifications(clubId, userId, false));
      clubCacheService.invalidate(CacheKeys.notifications(clubId, userId, true));
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to dismiss notification',
        'NOTIFICATION_DISMISS_ERROR',
        error
      );
    }
  }

  /**
   * Create meeting notification and invalidate cache
   */
  async createNotification(
    meetingId: string,
    clubId: string,
    notificationType: 'meeting_created' | 'meeting_updated' | 'meeting_cancelled' | 'meeting_reminder'
  ): Promise<void> {
    try {
      await createMeetingNotification(meetingId, clubId, notificationType);

      // Invalidate notification caches for all users (we don't know specific users)
      clubCacheService.invalidate(`notifications:${clubId}`);
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to create notification',
        'NOTIFICATION_CREATE_ERROR',
        error
      );
    }
  }

  // =====================================================
  // RSVP Management Methods
  // =====================================================

  /**
   * Create or update an RSVP for a meeting
   */
  async upsertRSVP(
    meetingId: string,
    clubId: string,
    userId: string,
    rsvpStatus: RSVPStatus
  ): Promise<ClubMeetingRSVP> {
    try {
      const rsvp = await upsertMeetingRSVP(meetingId, clubId, userId, rsvpStatus);

      // Invalidate RSVP-related caches
      this.invalidateRSVPCaches(clubId, meetingId);

      return rsvp;
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to update RSVP',
        'RSVP_UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Get user's RSVP for a meeting with caching
   */
  async getUserRSVP(
    meetingId: string,
    userId: string,
    useCache: boolean = true
  ): Promise<ClubMeetingRSVP | null> {
    const cacheKey = CacheKeys.userRSVP(meetingId, userId);

    return withCache(
      cacheKey,
      () => this.fetchUserRSVP(meetingId, userId),
      CacheExpiry.SHORT,
      useCache
    );
  }

  /**
   * Get RSVP statistics for a meeting with caching
   */
  async getMeetingRSVPStats(
    meetingId: string,
    useCache: boolean = true
  ): Promise<MeetingRSVPStats> {
    const cacheKey = CacheKeys.meetingRSVPStats(meetingId);

    return withCache(
      cacheKey,
      () => this.fetchMeetingRSVPStats(meetingId),
      CacheExpiry.SHORT,
      useCache
    );
  }

  /**
   * Get all RSVPs for a meeting with caching
   */
  async getMeetingRSVPs(
    meetingId: string,
    useCache: boolean = true
  ): Promise<ClubMeetingRSVP[]> {
    const cacheKey = CacheKeys.meetingRSVPs(meetingId);

    return withCache(
      cacheKey,
      () => this.fetchMeetingRSVPs(meetingId),
      CacheExpiry.SHORT,
      useCache
    );
  }

  /**
   * Delete an RSVP
   */
  async deleteRSVP(
    meetingId: string,
    userId: string,
    clubId: string
  ): Promise<void> {
    try {
      await deleteMeetingRSVP(meetingId, userId);

      // Invalidate RSVP-related caches
      this.invalidateRSVPCaches(clubId, meetingId);
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to delete RSVP',
        'RSVP_DELETE_ERROR',
        error
      );
    }
  }

  /**
   * Get club-wide RSVP statistics with caching
   */
  async getClubMeetingRSVPStats(
    clubId: string,
    useCache: boolean = true
  ): Promise<any[]> {
    const cacheKey = CacheKeys.clubRSVPStats(clubId);

    return withCache(
      cacheKey,
      () => this.fetchClubMeetingRSVPStats(clubId),
      CacheExpiry.SHORT,
      useCache
    );
  }

  // =====================================================
  // Integration Methods
  // =====================================================

  /**
   * Get events from main events system with caching
   */
  async getClubEvents(clubId: string, useCache: boolean = true): Promise<any[]> {
    const cacheKey = CacheKeys.clubEvents(clubId);

    return withCache(
      cacheKey,
      () => this.fetchClubEvents(clubId),
      CacheExpiry.MEDIUM,
      useCache
    );
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  private async fetchMeetings(clubId: string, options: MeetingQueryOptions): Promise<ClubMeeting[]> {
    return getClubMeetings(clubId, options);
  }

  private async fetchMeeting(clubId: string, meetingId: string): Promise<ClubMeeting | null> {
    return getClubMeeting(clubId, meetingId);
  }

  private async fetchMeetingAnalytics(clubId: string): Promise<MeetingAnalytics> {
    return getClubMeetingAnalytics(clubId);
  }

  private async fetchNotifications(
    clubId: string,
    userId: string,
    dismissed: boolean
  ): Promise<ClubEventNotification[]> {
    return getClubEventNotifications(clubId, userId, dismissed);
  }

  private async fetchClubEvents(clubId: string): Promise<any[]> {
    return getClubEvents(clubId);
  }

  private async fetchUserRSVP(meetingId: string, userId: string): Promise<ClubMeetingRSVP | null> {
    return getUserMeetingRSVP(meetingId, userId);
  }

  private async fetchMeetingRSVPStats(meetingId: string): Promise<MeetingRSVPStats> {
    return getMeetingRSVPStats(meetingId);
  }

  private async fetchMeetingRSVPs(meetingId: string): Promise<ClubMeetingRSVP[]> {
    return getMeetingRSVPs(meetingId);
  }

  private async fetchClubMeetingRSVPStats(clubId: string): Promise<any[]> {
    return getClubMeetingRSVPStats(clubId);
  }

  // =====================================================
  // Cache Management
  // =====================================================

  /**
   * Invalidate all meeting-related caches for a club
   */
  private invalidateMeetingCaches(clubId: string): void {
    clubCacheService.invalidate(`meetings:${clubId}`);
    clubCacheService.invalidate(CacheKeys.meetingAnalytics(clubId));
    // Also invalidate analytics cache since meetings affect analytics
    clubCacheService.invalidate(CacheKeys.analytics(clubId));
  }

  /**
   * Invalidate RSVP-related caches
   */
  private invalidateRSVPCaches(clubId: string, meetingId: string): void {
    // Invalidate meeting-specific RSVP caches
    clubCacheService.invalidate(`rsvp:meeting:${meetingId}`);
    clubCacheService.invalidate(`rsvp:stats:${meetingId}`);

    // Invalidate club-wide RSVP caches
    clubCacheService.invalidate(`rsvp:club:${clubId}`);

    // Also invalidate meeting caches since RSVP changes affect meeting data
    this.invalidateMeetingCaches(clubId);
  }

  /**
   * Clear meeting cache for a specific club
   */
  clearMeetingCache(clubId: string): void {
    this.invalidateMeetingCaches(clubId);
  }

  /**
   * Clear all meeting cache
   */
  clearAllMeetingCache(): void {
    clubCacheService.invalidate('meetings:');
    clubCacheService.invalidate('meetingAnalytics:');
    clubCacheService.invalidate('notifications:');
    clubCacheService.invalidate('clubEvents:');
  }
}

// =====================================================
// Singleton Instance
// =====================================================

export const clubEventsService = ClubEventsService.getInstance();

// Re-export types for convenience
export type {
  ClubMeeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  MeetingQueryOptions,
  ClubEventNotification,
  MeetingAnalytics
};
