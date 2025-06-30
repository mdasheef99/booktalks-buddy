/**
 * Club Events Service Module - Main Export
 * 
 * Aggregates all club events functionality with proper organization
 */

// =========================
// Type Exports
// =========================
export type {
  ClubMeeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  MeetingQueryOptions,
  ClubEventNotification,
  MeetingAnalytics,
  ClubManagementAPIError,
  ClubMeetingRSVP,
  MeetingRSVPStats,
  RSVPStatus,
  CacheConfig,
  ServiceResponse,
  EventServiceOptions,
  NotificationType,
  RSVPOperation,
  CacheInvalidationOptions
} from './types';

// =========================
// Event Query Functions
// =========================
export {
  getMeetings,
  getMeeting,
  getClubEventsData,
  refreshMeetings,
  searchMeetings,
  getUpcomingMeetings,
  getPastMeetings
} from './event-queries';

// =========================
// Event Creation Functions
// =========================
export {
  createMeeting,
  createMeetingsBatch,
  createRecurringMeetings,
  duplicateMeeting
} from './event-creation';

// =========================
// Event Management Functions
// =========================
export {
  updateMeeting,
  deleteMeeting,
  cancelMeeting,
  rescheduleMeeting,
  updateMeetingStatus,
  bulkUpdateMeetings,
  bulkDeleteMeetings,
  archiveOldMeetings
} from './event-management';

// =========================
// RSVP Management Functions
// =========================
export {
  rsvpToMeeting,
  getMeetingRSVPList,
  getRSVPStats,
  getUserRSVPStatus,
  getUserRSVPs,
  bulkRSVP,
  getMeetingsRSVPSummary,
  getClubAttendanceRate,
  refreshRSVPData
} from './rsvp-management';

// =========================
// Notification Functions
// =========================
export {
  createNotification,
  getNotifications,
  createMeetingReminders,
  sendImmediateNotification,
  scheduleMeetingNotifications,
  cancelMeetingNotifications,
  getNotificationStats
} from './event-notifications';

// =========================
// Validation Functions
// =========================
export {
  validateMeetingData,
  validateMeetingUpdateData,
  validateRSVPStatus,
  validateNotificationType
} from './event-validation';

// =========================
// Convenience Functions (for backward compatibility)
// =========================

/**
 * Get club meetings (alias for getMeetings)
 */
export async function getClubMeetings(
  clubId: string,
  options: MeetingQueryOptions = {},
  useCache: boolean = true
) {
  const { getMeetings } = await import('./event-queries');
  return getMeetings(clubId, options, useCache);
}

/**
 * Get club meeting (alias for getMeeting)
 */
export async function getClubMeeting(
  clubId: string,
  meetingId: string,
  useCache: boolean = true
) {
  const { getMeeting } = await import('./event-queries');
  return getMeeting(clubId, meetingId, useCache);
}

/**
 * Create club meeting (alias for createMeeting)
 */
export async function createClubMeeting(
  clubId: string,
  meetingData: CreateMeetingRequest,
  userId: string
) {
  const { createMeeting } = await import('./event-creation');
  return createMeeting(clubId, meetingData, userId);
}

/**
 * Update club meeting (alias for updateMeeting)
 */
export async function updateClubMeeting(
  clubId: string,
  meetingId: string,
  updates: UpdateMeetingRequest
) {
  const { updateMeeting } = await import('./event-management');
  return updateMeeting(clubId, meetingId, updates);
}

/**
 * Delete club meeting (alias for deleteMeeting)
 */
export async function deleteClubMeeting(
  clubId: string,
  meetingId: string
) {
  const { deleteMeeting } = await import('./event-management');
  return deleteMeeting(clubId, meetingId);
}

/**
 * Get club events (alias for getClubEventsData)
 */
export async function getClubEvents(
  clubId: string,
  useCache: boolean = true
) {
  const { getClubEventsData } = await import('./event-queries');
  return getClubEventsData(clubId, useCache);
}

/**
 * Create meeting RSVP (alias for rsvpToMeeting)
 */
export async function createMeetingRSVP(
  clubId: string,
  meetingId: string,
  userId: string,
  status: RSVPStatus
) {
  const { rsvpToMeeting } = await import('./rsvp-management');
  return rsvpToMeeting(clubId, meetingId, userId, status);
}

/**
 * Update meeting RSVP (alias for rsvpToMeeting)
 */
export async function updateMeetingRSVP(
  clubId: string,
  meetingId: string,
  userId: string,
  status: RSVPStatus
) {
  const { rsvpToMeeting } = await import('./rsvp-management');
  return rsvpToMeeting(clubId, meetingId, userId, status);
}

/**
 * Get meeting RSVPs (alias for getMeetingRSVPList)
 */
export async function getMeetingRSVPs(
  clubId: string,
  meetingId: string,
  useCache: boolean = true
) {
  const { getMeetingRSVPList } = await import('./rsvp-management');
  return getMeetingRSVPList(clubId, meetingId, useCache);
}

/**
 * Get meeting RSVP stats (alias for getRSVPStats)
 */
export async function getMeetingRSVPStats(
  clubId: string,
  meetingId: string,
  useCache: boolean = true
) {
  const { getRSVPStats } = await import('./rsvp-management');
  return getRSVPStats(clubId, meetingId, useCache);
}

/**
 * Create event notification (alias for createNotification)
 */
export async function createEventNotification(
  meetingId: string,
  clubId: string,
  type: NotificationType,
  customMessage?: string
) {
  const { createNotification } = await import('./event-notifications');
  return createNotification(meetingId, clubId, type, customMessage);
}

/**
 * Get event notifications (alias for getNotifications)
 */
export async function getEventNotifications(
  clubId: string,
  useCache: boolean = true
) {
  const { getNotifications } = await import('./event-notifications');
  return getNotifications(clubId, useCache);
}
