/**
 * Community Showcase Types and Interfaces
 * Centralized type definitions for the Community Showcase feature
 */

// ===== BASIC TYPES =====

export type SpotlightType = 'top_reviewer' | 'active_member' | 'helpful_contributor' | 'new_member';
export type TestimonialSourceType = 'manual' | 'review_import' | 'survey' | 'social_media';
export type TestimonialApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ActivityFeedType = 'discussion' | 'member_join' | 'book_set' | 'club_created';

// ===== USER DATA INTERFACE =====

export interface UserData {
  username: string;
  displayname?: string;
  membership_tier: string;
  created_at: string;
}

// ===== CORE INTERFACES =====

export interface MemberSpotlight {
  id: string;
  store_id: string;
  featured_member_id: string;
  spotlight_type: SpotlightType;
  spotlight_description: string;
  spotlight_start_date: string;
  spotlight_end_date?: string;
  show_member_spotlights: boolean;
  created_at: string;
  updated_at: string;
  // User data from join
  userData: UserData;
}

export interface Testimonial {
  id: string;
  store_id: string;
  customer_name?: string;
  testimonial_text: string;
  rating?: number;
  source_type: TestimonialSourceType;
  source_url?: string;
  is_anonymous: boolean;
  approval_status: TestimonialApprovalStatus;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityMetrics {
  active_members: number;
  total_clubs: number;
  recent_discussions: number;
  books_discussed_this_month: number;
  new_members_this_month: number;
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityFeedType;
  title: string;
  description: string;
  user_name?: string;
  club_name?: string;
  created_at: string;
}

// ===== SETTINGS INTERFACE =====

export interface ShowcaseSettings {
  show_member_spotlights: boolean;
  show_testimonials: boolean;
  show_activity_feed: boolean;
  show_community_metrics: boolean;
  max_spotlights_display: number;
  activity_feed_limit: number;
}

// ===== COMPOSITE DATA INTERFACE =====

export interface CommunityShowcaseData {
  memberSpotlights: MemberSpotlight[];
  testimonials: Testimonial[];
  communityMetrics: CommunityMetrics;
  activityFeed: ActivityFeedItem[];
  showcaseSettings: ShowcaseSettings;
}

// ===== FORM DATA INTERFACES =====

export interface TestimonialFormData {
  customer_name?: string;
  testimonial_text: string;
  rating?: number;
  source_type: TestimonialSourceType;
  source_url?: string;
  is_anonymous: boolean;
  is_featured: boolean;
}

export interface MemberSpotlightFormData {
  featured_member_id: string;
  spotlight_type: SpotlightType;
  spotlight_description: string;
  spotlight_end_date?: string;
}

// ===== SEARCH AND UTILITY INTERFACES =====

export interface StoreUser {
  id: string;
  username: string;
  displayname?: string;
  membership_tier: string;
  created_at: string;
  first_joined: string;
}

export interface ShowcaseSettingsUpdate {
  show_member_spotlights?: boolean;
  show_testimonials?: boolean;
  show_activity_feed?: boolean;
  show_community_metrics?: boolean;
  max_spotlights_display?: number;
  activity_feed_limit?: number;
}
