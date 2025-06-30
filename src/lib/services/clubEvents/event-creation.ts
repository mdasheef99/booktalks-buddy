/**
 * Event Creation Module
 * 
 * Handles event creation and setup logic with validation and caching
 */

import {
  createClubMeeting,
  ClubMeeting,
  CreateMeetingRequest,
  ClubManagementAPIError
} from '@/lib/api/clubManagement';
import { clubCacheService, CacheKeys } from '../clubCacheService';
import { validateMeetingData } from './event-validation';
import { createNotification } from './event-notifications';

/**
 * Create a new meeting with validation and cache invalidation
 */
export async function createMeeting(
  clubId: string,
  meetingData: CreateMeetingRequest,
  userId: string
): Promise<ClubMeeting> {
  try {
    // Validate meeting data before creation
    const validationResult = validateMeetingData(meetingData);
    if (!validationResult.valid) {
      throw new ClubManagementAPIError(
        `Invalid meeting data: ${validationResult.error}`,
        'MEETING_VALIDATION_ERROR',
        validationResult.details
      );
    }

    // Create the meeting
    const meeting = await createClubMeeting(clubId, meetingData, userId);

    // Invalidate related caches
    invalidateMeetingCaches(clubId);

    // Create notification for meeting creation
    try {
      await createNotification(meeting.id, clubId, 'meeting_created');
    } catch (notificationError) {
      // Log notification error but don't fail the meeting creation
      console.warn('Failed to create meeting notification:', notificationError);
    }

    return meeting;
  } catch (error) {
    if (error instanceof ClubManagementAPIError) {
      throw error;
    }
    
    throw new ClubManagementAPIError(
      'Failed to create meeting',
      'MEETING_CREATE_ERROR',
      error
    );
  }
}

/**
 * Create multiple meetings in batch
 */
export async function createMeetingsBatch(
  clubId: string,
  meetingsData: CreateMeetingRequest[],
  userId: string
): Promise<ClubMeeting[]> {
  const results: ClubMeeting[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  for (let i = 0; i < meetingsData.length; i++) {
    try {
      const meeting = await createMeeting(clubId, meetingsData[i], userId);
      results.push(meeting);
    } catch (error) {
      errors.push({ index: i, error: error as Error });
    }
  }

  if (errors.length > 0) {
    throw new ClubManagementAPIError(
      `Failed to create ${errors.length} out of ${meetingsData.length} meetings`,
      'BATCH_CREATE_ERROR',
      { errors, successCount: results.length }
    );
  }

  return results;
}

/**
 * Create recurring meetings
 */
export async function createRecurringMeetings(
  clubId: string,
  baseMeetingData: CreateMeetingRequest,
  userId: string,
  recurrenceOptions: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    count: number;
    startDate: Date;
  }
): Promise<ClubMeeting[]> {
  const meetings: CreateMeetingRequest[] = [];
  const { frequency, count, startDate } = recurrenceOptions;

  for (let i = 0; i < count; i++) {
    const meetingDate = new Date(startDate);
    
    switch (frequency) {
      case 'weekly':
        meetingDate.setDate(startDate.getDate() + (i * 7));
        break;
      case 'biweekly':
        meetingDate.setDate(startDate.getDate() + (i * 14));
        break;
      case 'monthly':
        meetingDate.setMonth(startDate.getMonth() + i);
        break;
    }

    meetings.push({
      ...baseMeetingData,
      start_time: meetingDate.toISOString(),
      title: `${baseMeetingData.title} (${i + 1}/${count})`
    });
  }

  return createMeetingsBatch(clubId, meetings, userId);
}

/**
 * Duplicate an existing meeting
 */
export async function duplicateMeeting(
  clubId: string,
  sourceMeetingId: string,
  newMeetingData: Partial<CreateMeetingRequest>,
  userId: string
): Promise<ClubMeeting> {
  try {
    // Get the source meeting to copy from
    const { getMeeting } = await import('./event-queries');
    const sourceMeeting = await getMeeting(clubId, sourceMeetingId, false);
    
    if (!sourceMeeting) {
      throw new ClubManagementAPIError(
        'Source meeting not found',
        'MEETING_NOT_FOUND',
        { meetingId: sourceMeetingId }
      );
    }

    // Create new meeting data based on source
    const duplicatedMeetingData: CreateMeetingRequest = {
      title: newMeetingData.title || `Copy of ${sourceMeeting.title}`,
      description: newMeetingData.description || sourceMeeting.description,
      start_time: newMeetingData.start_time || sourceMeeting.start_time,
      end_time: newMeetingData.end_time || sourceMeeting.end_time,
      location: newMeetingData.location || sourceMeeting.location,
      meeting_type: newMeetingData.meeting_type || sourceMeeting.meeting_type,
      max_participants: newMeetingData.max_participants || sourceMeeting.max_participants,
      is_virtual: newMeetingData.is_virtual !== undefined ? newMeetingData.is_virtual : sourceMeeting.is_virtual,
      virtual_link: newMeetingData.virtual_link || sourceMeeting.virtual_link,
      agenda: newMeetingData.agenda || sourceMeeting.agenda
    };

    return createMeeting(clubId, duplicatedMeetingData, userId);
  } catch (error) {
    if (error instanceof ClubManagementAPIError) {
      throw error;
    }
    
    throw new ClubManagementAPIError(
      'Failed to duplicate meeting',
      'MEETING_DUPLICATE_ERROR',
      error
    );
  }
}

// =====================================================
// Private Helper Functions
// =====================================================

/**
 * Invalidate all meeting-related caches for a club
 */
function invalidateMeetingCaches(clubId: string): void {
  clubCacheService.invalidate(`meetings:${clubId}`);
  clubCacheService.invalidate(CacheKeys.meetingAnalytics(clubId));
  // Also invalidate analytics cache since meetings affect analytics
  clubCacheService.invalidate(CacheKeys.analytics(clubId));
}
