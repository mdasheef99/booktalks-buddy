/**
 * Event Management Module
 * 
 * Handles event updates, deletion, and state management operations
 */

import {
  updateClubMeeting,
  deleteClubMeeting,
  ClubMeeting,
  UpdateMeetingRequest,
  ClubManagementAPIError
} from '@/lib/api/clubManagement';
import { clubCacheService, CacheKeys } from '../clubCacheService';
import { validateMeetingUpdateData } from './event-validation';
import { createNotification } from './event-notifications';

/**
 * Update a meeting with validation and cache invalidation
 */
export async function updateMeeting(
  clubId: string,
  meetingId: string,
  updates: UpdateMeetingRequest
): Promise<ClubMeeting> {
  try {
    // Validate update data
    const validationResult = validateMeetingUpdateData(updates);
    if (!validationResult.valid) {
      throw new ClubManagementAPIError(
        `Invalid meeting update data: ${validationResult.error}`,
        'MEETING_VALIDATION_ERROR',
        validationResult.details
      );
    }

    // Update the meeting
    const meeting = await updateClubMeeting(clubId, meetingId, updates);

    // Invalidate related caches
    invalidateMeetingCaches(clubId);
    clubCacheService.invalidate(CacheKeys.meeting(clubId, meetingId));

    // Create notification for meeting update
    try {
      await createNotification(meetingId, clubId, 'meeting_updated');
    } catch (notificationError) {
      // Log notification error but don't fail the meeting update
      console.warn('Failed to create meeting update notification:', notificationError);
    }

    return meeting;
  } catch (error) {
    if (error instanceof ClubManagementAPIError) {
      throw error;
    }
    
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
export async function deleteMeeting(
  clubId: string, 
  meetingId: string
): Promise<void> {
  try {
    // Delete the meeting
    await deleteClubMeeting(clubId, meetingId);

    // Invalidate related caches
    invalidateMeetingCaches(clubId);
    clubCacheService.invalidate(CacheKeys.meeting(clubId, meetingId));

    // Create notification for meeting cancellation
    try {
      await createNotification(meetingId, clubId, 'meeting_cancelled');
    } catch (notificationError) {
      // Log notification error but don't fail the meeting deletion
      console.warn('Failed to create meeting cancellation notification:', notificationError);
    }
  } catch (error) {
    throw new ClubManagementAPIError(
      'Failed to delete meeting',
      'MEETING_DELETE_ERROR',
      error
    );
  }
}

/**
 * Cancel a meeting (soft delete with status update)
 */
export async function cancelMeeting(
  clubId: string,
  meetingId: string,
  reason?: string
): Promise<ClubMeeting> {
  const updates: UpdateMeetingRequest = {
    status: 'cancelled',
    cancellation_reason: reason
  };

  return updateMeeting(clubId, meetingId, updates);
}

/**
 * Reschedule a meeting
 */
export async function rescheduleMeeting(
  clubId: string,
  meetingId: string,
  newStartTime: string,
  newEndTime?: string
): Promise<ClubMeeting> {
  const updates: UpdateMeetingRequest = {
    start_time: newStartTime,
    ...(newEndTime && { end_time: newEndTime })
  };

  return updateMeeting(clubId, meetingId, updates);
}

/**
 * Update meeting status
 */
export async function updateMeetingStatus(
  clubId: string,
  meetingId: string,
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
): Promise<ClubMeeting> {
  const updates: UpdateMeetingRequest = {
    status
  };

  return updateMeeting(clubId, meetingId, updates);
}

/**
 * Bulk update meetings
 */
export async function bulkUpdateMeetings(
  clubId: string,
  updates: Array<{ meetingId: string; data: UpdateMeetingRequest }>
): Promise<ClubMeeting[]> {
  const results: ClubMeeting[] = [];
  const errors: Array<{ meetingId: string; error: Error }> = [];

  for (const update of updates) {
    try {
      const meeting = await updateMeeting(clubId, update.meetingId, update.data);
      results.push(meeting);
    } catch (error) {
      errors.push({ meetingId: update.meetingId, error: error as Error });
    }
  }

  if (errors.length > 0) {
    throw new ClubManagementAPIError(
      `Failed to update ${errors.length} out of ${updates.length} meetings`,
      'BULK_UPDATE_ERROR',
      { errors, successCount: results.length }
    );
  }

  return results;
}

/**
 * Bulk delete meetings
 */
export async function bulkDeleteMeetings(
  clubId: string,
  meetingIds: string[]
): Promise<void> {
  const errors: Array<{ meetingId: string; error: Error }> = [];

  for (const meetingId of meetingIds) {
    try {
      await deleteMeeting(clubId, meetingId);
    } catch (error) {
      errors.push({ meetingId, error: error as Error });
    }
  }

  if (errors.length > 0) {
    throw new ClubManagementAPIError(
      `Failed to delete ${errors.length} out of ${meetingIds.length} meetings`,
      'BULK_DELETE_ERROR',
      { errors, successCount: meetingIds.length - errors.length }
    );
  }
}

/**
 * Archive old meetings
 */
export async function archiveOldMeetings(
  clubId: string,
  cutoffDate: Date
): Promise<number> {
  try {
    const { getMeetings } = await import('./event-queries');
    
    // Get all past meetings before cutoff date
    const meetings = await getMeetings(clubId, {
      upcoming: false,
      before: cutoffDate.toISOString()
    }, false);

    // Update meetings to archived status
    const archiveUpdates = meetings.map(meeting => ({
      meetingId: meeting.id,
      data: { status: 'archived' as const }
    }));

    if (archiveUpdates.length > 0) {
      await bulkUpdateMeetings(clubId, archiveUpdates);
    }

    return archiveUpdates.length;
  } catch (error) {
    throw new ClubManagementAPIError(
      'Failed to archive old meetings',
      'MEETING_ARCHIVE_ERROR',
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
