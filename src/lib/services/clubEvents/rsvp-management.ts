/**
 * RSVP Management Module
 * 
 * Handles RSVP operations and statistics for club events
 */

import {
  upsertMeetingRSVP,
  getMeetingRSVPs,
  getMeetingRSVPStats,
  ClubMeetingRSVP,
  MeetingRSVPStats,
  RSVPStatus,
  ClubManagementAPIError
} from '@/lib/api/clubManagement';
import { clubCacheService, CacheKeys, CacheExpiry, withCache } from '../clubCacheService';
import { validateRSVPStatus } from './event-validation';

/**
 * Create or update RSVP for a meeting
 */
export async function rsvpToMeeting(
  clubId: string,
  meetingId: string,
  userId: string,
  status: RSVPStatus
): Promise<ClubMeetingRSVP> {
  try {
    // Validate RSVP status
    const validationResult = validateRSVPStatus(status);
    if (!validationResult.valid) {
      throw new ClubManagementAPIError(
        `Invalid RSVP status: ${validationResult.error}`,
        'RSVP_VALIDATION_ERROR',
        validationResult.details
      );
    }

    // Use upsert function which handles both create and update
    const rsvp = await upsertMeetingRSVP(meetingId, clubId, userId, status);

    // Invalidate related caches
    invalidateRSVPCaches(clubId, meetingId);

    return rsvp;
  } catch (error) {
    if (error instanceof ClubManagementAPIError) {
      throw error;
    }
    
    throw new ClubManagementAPIError(
      'Failed to RSVP to meeting',
      'RSVP_ERROR',
      error
    );
  }
}

/**
 * Get RSVPs for a meeting with caching
 */
export async function getMeetingRSVPList(
  clubId: string,
  meetingId: string,
  useCache: boolean = true
): Promise<ClubMeetingRSVP[]> {
  const cacheKey = CacheKeys.meetingRSVPs(meetingId);

  return withCache(
    cacheKey,
    () => getMeetingRSVPs(meetingId),
    CacheExpiry.SHORT, // 2 minutes - RSVPs change frequently
    useCache
  );
}

/**
 * Get RSVP statistics for a meeting with caching
 */
export async function getRSVPStats(
  clubId: string,
  meetingId: string,
  useCache: boolean = true
): Promise<MeetingRSVPStats> {
  const cacheKey = CacheKeys.meetingRSVPStats(meetingId);

  return withCache(
    cacheKey,
    () => getMeetingRSVPStats(meetingId),
    CacheExpiry.SHORT, // 2 minutes
    useCache
  );
}

/**
 * Get user's RSVP status for a meeting
 */
export async function getUserRSVPStatus(
  clubId: string,
  meetingId: string,
  userId: string,
  useCache: boolean = true
): Promise<RSVPStatus | null> {
  try {
    const rsvps = await getMeetingRSVPList(clubId, meetingId, useCache);
    const userRSVP = rsvps.find(rsvp => rsvp.user_id === userId);
    return userRSVP ? userRSVP.status : null;
  } catch (error) {
    console.warn('Failed to get user RSVP status:', error);
    return null;
  }
}

/**
 * Get all RSVPs for a user across meetings
 */
export async function getUserRSVPs(
  clubId: string,
  userId: string,
  useCache: boolean = true
): Promise<ClubMeetingRSVP[]> {
  const cacheKey = CacheKeys.userRSVPs(clubId, userId);

  if (useCache) {
    const cached = clubCacheService.get<ClubMeetingRSVP[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    // This would need to be implemented in the API layer
    // For now, we'll return empty array as placeholder
    const userRSVPs: ClubMeetingRSVP[] = [];
    
    // Cache the results
    clubCacheService.set(cacheKey, userRSVPs, CacheExpiry.MEDIUM);
    
    return userRSVPs;
  } catch (error) {
    throw new ClubManagementAPIError(
      'Failed to get user RSVPs',
      'USER_RSVP_ERROR',
      error
    );
  }
}

/**
 * Bulk RSVP operations
 */
export async function bulkRSVP(
  clubId: string,
  operations: Array<{
    meetingId: string;
    userId: string;
    status: RSVPStatus;
  }>
): Promise<ClubMeetingRSVP[]> {
  const results: ClubMeetingRSVP[] = [];
  const errors: Array<{ operation: any; error: Error }> = [];

  for (const operation of operations) {
    try {
      const rsvp = await rsvpToMeeting(
        clubId,
        operation.meetingId,
        operation.userId,
        operation.status
      );
      results.push(rsvp);
    } catch (error) {
      errors.push({ operation, error: error as Error });
    }
  }

  if (errors.length > 0) {
    throw new ClubManagementAPIError(
      `Failed to process ${errors.length} out of ${operations.length} RSVP operations`,
      'BULK_RSVP_ERROR',
      { errors, successCount: results.length }
    );
  }

  return results;
}

/**
 * Get RSVP summary for multiple meetings
 */
export async function getMeetingsRSVPSummary(
  clubId: string,
  meetingIds: string[],
  useCache: boolean = true
): Promise<Record<string, MeetingRSVPStats>> {
  const summary: Record<string, MeetingRSVPStats> = {};
  const errors: Array<{ meetingId: string; error: Error }> = [];

  for (const meetingId of meetingIds) {
    try {
      const stats = await getRSVPStats(clubId, meetingId, useCache);
      summary[meetingId] = stats;
    } catch (error) {
      errors.push({ meetingId, error: error as Error });
    }
  }

  if (errors.length > 0) {
    console.warn('Some RSVP stats failed to load:', errors);
  }

  return summary;
}

/**
 * Get attendance rate for a club
 */
export async function getClubAttendanceRate(
  clubId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalMeetings: number;
  averageAttendance: number;
  attendanceRate: number;
  rsvpRate: number;
}> {
  try {
    // This would need to be implemented with proper date filtering
    // For now, we'll return a placeholder structure
    const stats = {
      totalMeetings: 0,
      averageAttendance: 0,
      attendanceRate: 0,
      rsvpRate: 0
    };

    return stats;
  } catch (error) {
    throw new ClubManagementAPIError(
      'Failed to get club attendance rate',
      'ATTENDANCE_RATE_ERROR',
      error
    );
  }
}

/**
 * Refresh RSVP data (bypass cache)
 */
export async function refreshRSVPData(
  clubId: string,
  meetingId: string
): Promise<{
  rsvps: ClubMeetingRSVP[];
  stats: MeetingRSVPStats;
}> {
  // Invalidate caches
  invalidateRSVPCaches(clubId, meetingId);

  // Fetch fresh data
  const [rsvps, stats] = await Promise.all([
    getMeetingRSVPList(clubId, meetingId, false),
    getRSVPStats(clubId, meetingId, false)
  ]);

  return { rsvps, stats };
}

// =====================================================
// Private Helper Functions
// =====================================================

/**
 * Invalidate RSVP-related caches
 */
function invalidateRSVPCaches(clubId: string, meetingId: string): void {
  clubCacheService.invalidate(CacheKeys.meetingRSVPs(meetingId));
  clubCacheService.invalidate(CacheKeys.meetingRSVPStats(meetingId));
  // Also invalidate meeting analytics since RSVPs affect analytics
  clubCacheService.invalidate(CacheKeys.meetingAnalytics(clubId));
}
