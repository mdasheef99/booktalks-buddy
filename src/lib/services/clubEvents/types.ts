/**
 * Club Events Types Module
 * 
 * Shared types and interfaces for the club events service
 */

// Re-export types from the API layer for convenience
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
  RSVPStatus
} from '@/lib/api/clubManagement';

// Service-specific types
export interface CacheConfig {
  useCache: boolean;
  expiry?: 'SHORT' | 'MEDIUM' | 'LONG';
}

export interface ServiceResponse<T> {
  data: T;
  cached: boolean;
  timestamp: number;
}

export interface EventServiceOptions {
  cache?: CacheConfig;
  refresh?: boolean;
}

// Notification types for the service layer
export type NotificationType = 
  | 'meeting_created' 
  | 'meeting_updated' 
  | 'meeting_cancelled' 
  | 'meeting_reminder';

// RSVP operation types
export interface RSVPOperation {
  meetingId: string;
  clubId: string;
  userId: string;
  status: RSVPStatus;
}

// Cache invalidation types
export interface CacheInvalidationOptions {
  clubId: string;
  meetingId?: string;
  userId?: string;
  scope?: 'meeting' | 'rsvp' | 'notification' | 'analytics' | 'all';
}
