/**
 * Event Queries Module
 * 
 * Handles event retrieval, search, and filtering operations with caching
 */

import {
  getClubMeetings,
  getClubMeeting,
  getClubEvents,
  ClubMeeting,
  MeetingQueryOptions
} from '@/lib/api/clubManagement';
import { clubCacheService, CacheKeys, CacheExpiry, withCache } from '../clubCacheService';

/**
 * Get club meetings with caching
 */
export async function getMeetings(
  clubId: string,
  options: MeetingQueryOptions = {},
  useCache: boolean = true
): Promise<ClubMeeting[]> {
  const cacheKey = CacheKeys.meetings(clubId, options);

  return withCache(
    cacheKey,
    () => fetchMeetings(clubId, options),
    CacheExpiry.MEDIUM, // 5 minutes
    useCache
  );
}

/**
 * Get a specific meeting with caching
 */
export async function getMeeting(
  clubId: string,
  meetingId: string,
  useCache: boolean = true
): Promise<ClubMeeting | null> {
  const cacheKey = CacheKeys.meeting(clubId, meetingId);

  return withCache(
    cacheKey,
    () => fetchMeeting(clubId, meetingId),
    CacheExpiry.MEDIUM,
    useCache
  );
}

/**
 * Get events from main events system with caching
 */
export async function getClubEventsData(
  clubId: string, 
  useCache: boolean = true
): Promise<any[]> {
  const cacheKey = CacheKeys.clubEvents(clubId);

  return withCache(
    cacheKey,
    () => fetchClubEvents(clubId),
    CacheExpiry.MEDIUM,
    useCache
  );
}

/**
 * Refresh meetings data (bypass cache)
 */
export async function refreshMeetings(
  clubId: string, 
  options: MeetingQueryOptions = {}
): Promise<ClubMeeting[]> {
  // Invalidate cache and fetch fresh data
  invalidateMeetingCaches(clubId);
  return getMeetings(clubId, options, false);
}

/**
 * Search meetings by criteria
 */
export async function searchMeetings(
  clubId: string,
  searchTerm: string,
  options: MeetingQueryOptions = {}
): Promise<ClubMeeting[]> {
  const searchOptions = {
    ...options,
    search: searchTerm
  };
  
  return getMeetings(clubId, searchOptions, false); // Don't cache search results
}

/**
 * Get upcoming meetings for a club
 */
export async function getUpcomingMeetings(
  clubId: string,
  limit: number = 5,
  useCache: boolean = true
): Promise<ClubMeeting[]> {
  const options: MeetingQueryOptions = {
    upcoming: true,
    limit
  };
  
  return getMeetings(clubId, options, useCache);
}

/**
 * Get past meetings for a club
 */
export async function getPastMeetings(
  clubId: string,
  limit: number = 10,
  useCache: boolean = true
): Promise<ClubMeeting[]> {
  const options: MeetingQueryOptions = {
    upcoming: false,
    limit
  };
  
  return getMeetings(clubId, options, useCache);
}

// =====================================================
// Private Helper Functions
// =====================================================

/**
 * Fetch meetings from API
 */
async function fetchMeetings(
  clubId: string, 
  options: MeetingQueryOptions
): Promise<ClubMeeting[]> {
  return getClubMeetings(clubId, options);
}

/**
 * Fetch single meeting from API
 */
async function fetchMeeting(
  clubId: string, 
  meetingId: string
): Promise<ClubMeeting | null> {
  return getClubMeeting(clubId, meetingId);
}

/**
 * Fetch club events from API
 */
async function fetchClubEvents(clubId: string): Promise<any[]> {
  return getClubEvents(clubId);
}

/**
 * Invalidate meeting-related caches
 */
function invalidateMeetingCaches(clubId: string): void {
  clubCacheService.invalidate(`meetings:${clubId}`);
  clubCacheService.invalidate(CacheKeys.meetingAnalytics(clubId));
  // Also invalidate analytics cache since meetings affect analytics
  clubCacheService.invalidate(CacheKeys.analytics(clubId));
}
