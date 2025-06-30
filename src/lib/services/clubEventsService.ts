/**
 * Club Events Service
 *
 * @deprecated This file is being refactored into modular structure.
 * Please import from '@/lib/services/clubEvents/' instead.
 *
 * This file will be removed in a future version.
 */

// Re-export everything from the new modular structure for backward compatibility
export * from './clubEvents/index';




// Backward compatibility - export the singleton instance
import * as clubEventsModule from './clubEvents/index';

// Create a singleton-like interface for backward compatibility
export const clubEventsService = {
  // Core meeting methods
  getMeetings: clubEventsModule.getMeetings,
  getMeeting: clubEventsModule.getMeeting,
  createMeeting: clubEventsModule.createMeeting,
  updateMeeting: clubEventsModule.updateMeeting,
  deleteMeeting: clubEventsModule.deleteMeeting,
  refreshMeetings: clubEventsModule.refreshMeetings,

  // RSVP methods
  upsertRSVP: clubEventsModule.rsvpToMeeting,
  getUserRSVP: clubEventsModule.getUserRSVPStatus,
  getMeetingRSVPStats: clubEventsModule.getRSVPStats,
  getMeetingRSVPs: clubEventsModule.getMeetingRSVPList,
  getClubMeetingRSVPStats: clubEventsModule.getClubAttendanceRate,

  // Notification methods
  getNotifications: clubEventsModule.getNotifications,
  createNotification: clubEventsModule.createNotification,

  // Integration methods
  getClubEvents: clubEventsModule.getClubEventsData,

  // Cache management (placeholder methods for compatibility)
  clearMeetingCache: (clubId: string) => {
    console.warn('clearMeetingCache is deprecated. Cache is managed automatically.');
  },
  clearAllMeetingCache: () => {
    console.warn('clearAllMeetingCache is deprecated. Cache is managed automatically.');
  }
};
