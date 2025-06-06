/**
 * Club Management Utility Functions
 *
 * Helper functions and error handling utilities.
 */

import { ClubManagementAPIError } from './types';

// =====================================================
// Phase 3: Events/Meetings API - Implemented
// =====================================================

// Note: The actual meeting functions are now implemented in events.ts
// These are kept for backward compatibility but delegate to the main implementation

import { createClubMeeting as createMeeting, getClubMeetings as getMeetings } from './events';
import { CreateMeetingRequest, MeetingQueryOptions } from './types';

/**
 * Create club meeting (Phase 3 implementation)
 */
export async function createClubMeeting(
  clubId: string,
  meeting: CreateMeetingRequest,
  userId: string
): Promise<any> {
  return createMeeting(clubId, meeting, userId);
}

/**
 * Get club meetings (Phase 3 implementation)
 */
export async function getClubMeetings(
  clubId: string,
  options?: MeetingQueryOptions
): Promise<any[]> {
  return getMeetings(clubId, options);
}

// =====================================================
// Error Handling Utilities
// =====================================================

/**
 * Handle API errors consistently
 */
export function handleAPIError(error: any, context: string): never {
  console.error(`Club Management API Error (${context}):`, error);

  if (error instanceof ClubManagementAPIError) {
    throw error;
  }

  throw new ClubManagementAPIError(
    `Failed to ${context}`,
    error.code || 'UNKNOWN_ERROR',
    error
  );
}
