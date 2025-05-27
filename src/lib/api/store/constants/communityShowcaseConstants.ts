/**
 * Community Showcase Constants
 * Centralized constants for the Community Showcase feature
 */

import type {
  ShowcaseSettings,
  SpotlightType,
  TestimonialSourceType,
  TestimonialApprovalStatus,
  ActivityFeedType
} from '../types/communityShowcaseTypes';

// ===== DEFAULT SETTINGS =====

export const DEFAULT_SHOWCASE_SETTINGS: ShowcaseSettings = {
  show_member_spotlights: false,
  show_testimonials: false,
  show_activity_feed: false,
  show_community_metrics: false,
  max_spotlights_display: 3,
  activity_feed_limit: 5,
};

// ===== SPOTLIGHT TYPES =====

export const SPOTLIGHT_TYPES: Record<SpotlightType, string> = {
  top_reviewer: 'Top Reviewer',
  active_member: 'Active Member',
  helpful_contributor: 'Helpful Contributor',
  new_member: 'New Member',
} as const;

export const SPOTLIGHT_TYPE_OPTIONS: Array<{ value: SpotlightType; label: string }> = [
  { value: 'top_reviewer', label: 'Top Reviewer' },
  { value: 'active_member', label: 'Active Member' },
  { value: 'helpful_contributor', label: 'Helpful Contributor' },
  { value: 'new_member', label: 'New Member' },
];

// ===== TESTIMONIAL SOURCE TYPES =====

export const TESTIMONIAL_SOURCE_TYPES: Record<TestimonialSourceType, string> = {
  manual: 'Manual Entry',
  review_import: 'Review Import',
  survey: 'Survey Response',
  social_media: 'Social Media',
} as const;

export const TESTIMONIAL_SOURCE_OPTIONS: Array<{ value: TestimonialSourceType; label: string }> = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'review_import', label: 'Review Import' },
  { value: 'survey', label: 'Survey Response' },
  { value: 'social_media', label: 'Social Media' },
];

// ===== APPROVAL STATUSES =====

export const APPROVAL_STATUSES: Record<TestimonialApprovalStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
} as const;

export const APPROVAL_STATUS_OPTIONS: Array<{ value: TestimonialApprovalStatus; label: string }> = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// ===== ACTIVITY FEED TYPES =====

export const ACTIVITY_FEED_TYPES: Record<ActivityFeedType, string> = {
  discussion: 'Discussion',
  member_join: 'Member Join',
  book_set: 'Book Set',
  club_created: 'Club Created',
} as const;

// ===== QUERY LIMITS =====

export const QUERY_LIMITS = {
  DEFAULT_TESTIMONIALS: 10,
  DEFAULT_SPOTLIGHTS: 6,
  DEFAULT_ACTIVITY_FEED: 5,
  MEMBER_SEARCH: 20,
  MAX_SPOTLIGHTS_DISPLAY: 6,
  MAX_ACTIVITY_FEED: 10,
} as const;

// ===== TIME PERIODS =====

export const TIME_PERIODS = {
  THIRTY_DAYS_MS: 30 * 24 * 60 * 60 * 1000,
  FIRST_OF_MONTH_OFFSET: 0, // Used for setting date to first of month
} as const;

// ===== DATABASE TABLE NAMES =====

export const TABLE_NAMES = {
  STORE_COMMUNITY_SHOWCASE: 'store_community_showcase',
  STORE_TESTIMONIALS: 'store_testimonials',
  CLUB_MEMBERS: 'club_members',
  BOOK_CLUBS: 'book_clubs',
  DISCUSSION_TOPICS: 'discussion_topics',
  CURRENT_BOOKS: 'current_books',
  USERS: 'users',
} as const;

// ===== SUPABASE QUERY SELECTORS =====

export const QUERY_SELECTORS = {
  MEMBER_SPOTLIGHT_WITH_USER: `
    *
  `,
  DISCUSSION_WITH_CLUB_AND_USER: `
    id,
    title,
    created_at,
    user_id,
    club_id,
    book_clubs!inner(name, store_id),
    users!inner(username, displayname)
  `,
  MEMBER_WITH_CLUB_AND_USER: `
    user_id,
    joined_at,
    club_id,
    book_clubs!inner(name, store_id),
    users!inner(username, displayname)
  `,
  STORE_MEMBER_SEARCH: `
    user_id,
    joined_at,
    users!inner(
      id,
      username,
      displayname,
      account_tier,
      created_at
    ),
    book_clubs!inner(store_id)
  `,
  SHOWCASE_SETTINGS: 'show_member_spotlights, show_testimonials, show_activity_feed, show_community_metrics, max_spotlights_display, activity_feed_limit',
} as const;

// ===== ERROR MESSAGES =====

export const ERROR_MESSAGES = {
  FETCH_SPOTLIGHTS: 'Failed to fetch member spotlights',
  FETCH_TESTIMONIALS: 'Failed to fetch testimonials',
  FETCH_METRICS: 'Failed to fetch community metrics',
  FETCH_ACTIVITY: 'Failed to fetch recent activity',
  FETCH_SETTINGS: 'Failed to fetch showcase settings',
  CREATE_SPOTLIGHT: 'Failed to create member spotlight',
  UPDATE_SPOTLIGHT: 'Failed to update member spotlight',
  DELETE_SPOTLIGHT: 'Failed to delete member spotlight',
  SEARCH_MEMBERS: 'Failed to search members',
  CREATE_TESTIMONIAL: 'Failed to create testimonial',
  UPDATE_TESTIMONIAL: 'Failed to update testimonial',
  DELETE_TESTIMONIAL: 'Failed to delete testimonial',
  UPDATE_APPROVAL: 'Failed to update testimonial approval',
  REORDER_TESTIMONIALS: 'Failed to reorder testimonials',
  UPDATE_SETTINGS: 'Failed to update showcase settings',
  CREATE_SETTINGS: 'Failed to create showcase settings',
} as const;
