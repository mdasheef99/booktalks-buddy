/**
 * Club Management API Foundation
 *
 * This module provides the API foundation for club management features
 * across all phases of implementation.
 *
 * Phase 1: Foundation (Current)
 * Phase 2: Analytics Dashboard
 * Phase 3: Events Integration
 */

// Type exports
export type {
  ClubAnalyticsSnapshot,
  ClubModerator,
  BasicClubAnalytics,
  EnhancedAnalytics,
  AnalyticsInsight,
  AnalyticsExportOptions,
  ClubMeeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  MeetingQueryOptions,
  ClubEventNotification,
  MeetingAnalytics,
  RecurrencePattern
} from './types.js';

export { ClubManagementAPIError } from './types.js';

// Analytics API exports
export {
  getClubAnalyticsSummary,
  createDailyAnalyticsSnapshot,
  getClubAnalyticsSnapshots,
  getAnalyticsTrends
} from './analytics.js';

// Enhanced Analytics exports
export { getEnhancedAnalytics } from './enhancedAnalytics.js';

// Moderator Management exports
export {
  getClubModerators,
  updateModeratorPermissions,
  toggleModeratorAnalytics
} from './moderators.js';

// Calculation utilities exports
export {
  calculateEngagementMetrics,
  calculateTrendAnalysis,
  calculateComparativePeriods,
  generateAnalyticsInsights
} from './calculations.js';

// Export utilities exports
export { exportAnalytics } from './export.js';

// Events/Meetings API exports
export {
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
  // RSVP exports
  upsertMeetingRSVP,
  getUserMeetingRSVP,
  getMeetingRSVPs,
  getMeetingRSVPStats,
  getClubMeetingRSVPStats,
  deleteMeetingRSVP
} from './events.js';

// Utility functions exports
export {
  handleAPIError
} from './utils.js';




