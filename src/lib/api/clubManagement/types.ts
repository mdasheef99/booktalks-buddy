/**
 * Club Management API Types
 *
 * Type definitions for club management features across all phases.
 */

// =====================================================
// Core Data Types
// =====================================================

export interface ClubAnalyticsSnapshot {
  id: string;
  club_id: string;
  snapshot_date: string;
  member_count: number;
  active_members_week: number;
  new_members_month: number;
  discussion_count: number;
  posts_count: number;
  posts_this_week: number;
  reading_completion_rate: number;
  current_book_progress: number;
  meeting_attendance_rate: number;
  meetings_this_month: number;
  created_at: string;
  updated_at: string;
}

export interface ClubModerator {
  id: string;
  club_id: string;
  user_id: string;
  appointed_by?: string;
  appointed_at: string;
  role: 'moderator' | 'lead';
  is_active: boolean;
  analytics_access: boolean;
  meeting_management_access: boolean;
  customization_access: boolean;
  content_moderation_access: boolean;
  member_management_access: boolean;
  created_at: string;
  updated_at: string;
  // User profile data (joined from users table)
  user?: {
    username: string;
    email: string;
    display_name?: string;
  };
}

// =====================================================
// Analytics Types
// =====================================================

export interface BasicClubAnalytics {
  memberMetrics: {
    totalMembers: number;
    activeMembersThisWeek: number;
    newMembersThisMonth: number;
    memberGrowthTrend: number[];
    engagementScore: number;
    retentionRate: number;
  };
  discussionMetrics: {
    totalTopics: number;
    totalPosts: number;
    postsThisWeek: number;
    averagePostsPerTopic: number;
    participationRate: number;
    activityTrend: 'increasing' | 'stable' | 'decreasing';
  };
  bookMetrics: {
    currentBook: string | null;
    booksReadThisYear: number;
    averageReadingTime: number;
    readingPace: number;
    completionRate: number;
  };
  moderatorAccess: {
    analyticsEnabled: boolean;
  };
  lastUpdated: string;
}

export interface EnhancedAnalytics extends BasicClubAnalytics {
  engagementMetrics: {
    memberEngagementScore: number;
    discussionParticipationRate: number;
    readingCompletionRate: number;
    overallHealthScore: number;
  };
  trendAnalysis: {
    memberGrowthTrend: 'growing' | 'stable' | 'declining';
    activityTrend: 'increasing' | 'stable' | 'decreasing';
    engagementTrend: 'improving' | 'stable' | 'declining';
  };
  comparativePeriods: {
    previousWeek: Partial<BasicClubAnalytics>;
    previousMonth: Partial<BasicClubAnalytics>;
    yearOverYear: Partial<BasicClubAnalytics>;
  };
  insights: AnalyticsInsight[];
}

// =====================================================
// Phase 3: Events/Meetings Types
// =====================================================

export interface ClubMeeting {
  id: string;
  club_id: string;
  title: string;
  description?: string;
  meeting_type: 'discussion' | 'social' | 'planning' | 'author_event' | 'other';
  scheduled_at: string;
  duration_minutes: number;
  virtual_link?: string;
  max_attendees?: number;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_username?: string;
}

export interface RecurrencePattern {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  end_date?: string;
  max_occurrences?: number;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  meeting_type: 'discussion' | 'social' | 'planning' | 'author_event' | 'other';
  scheduled_at: string;
  duration_minutes?: number;
  virtual_link?: string;
  max_attendees?: number;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  meeting_type?: 'discussion' | 'social' | 'planning' | 'author_event' | 'other';
  scheduled_at?: string;
  duration_minutes?: number;
  virtual_link?: string;
  max_attendees?: number;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
}

export interface MeetingQueryOptions {
  upcoming?: boolean;
  limit?: number;
  offset?: number;
  meeting_type?: string;
}

export interface ClubEventNotification {
  id: string;
  club_id: string;
  user_id: string;
  meeting_id?: string;
  notification_type: 'meeting_created' | 'meeting_updated' | 'meeting_cancelled' | 'meeting_reminder';
  title: string;
  message?: string;
  is_dismissed: boolean;
  created_at: string;
  dismissed_at?: string;
}

export interface MeetingAnalytics {
  total_meetings: number;
  upcoming_meetings: number;
  meetings_this_month: number;
  avg_duration_minutes: number;
  most_common_type?: string;
}

export interface AnalyticsInsight {
  type: 'positive' | 'neutral' | 'warning' | 'critical';
  category: 'members' | 'discussions' | 'books' | 'engagement';
  title: string;
  description: string;
  recommendation?: string;
  metric?: number;
}

// =====================================================
// Export Types
// =====================================================

export interface AnalyticsExportOptions {
  format: 'pdf' | 'csv';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  sections: ('members' | 'discussions' | 'books' | 'insights')[];
}

// =====================================================
// RSVP System Types
// =====================================================

export type RSVPStatus = 'going' | 'maybe' | 'not_going';

export interface ClubMeetingRSVP {
  id: string;
  meeting_id: string;
  user_id: string;
  club_id: string;
  rsvp_status: RSVPStatus;
  rsvp_at: string;
  updated_at: string;
}

export interface CreateRSVPRequest {
  meeting_id: string;
  club_id: string;
  rsvp_status: RSVPStatus;
}

export interface UpdateRSVPRequest {
  rsvp_status: RSVPStatus;
}

export interface MeetingRSVPStats {
  total_rsvps: number;
  going_count: number;
  maybe_count: number;
  not_going_count: number;
  response_rate: number;
}

export interface ClubMeetingWithRSVP extends ClubMeeting {
  rsvp_stats?: MeetingRSVPStats;
  user_rsvp?: ClubMeetingRSVP;
}

// =====================================================
// Error Types
// =====================================================

export class ClubManagementAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ClubManagementAPIError';
  }
}
