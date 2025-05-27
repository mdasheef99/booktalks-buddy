/**
 * Community Showcase Utility Functions
 * Reusable utility functions for data processing and business logic
 */

import type { 
  ActivityFeedItem, 
  StoreUser, 
  CommunityMetrics 
} from '../types/communityShowcaseTypes';

// ===== DATE UTILITIES =====

/**
 * Get date for 30 days ago
 */
export const getThirtyDaysAgo = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date;
};

/**
 * Get first day of current month
 */
export const getFirstOfMonth = (): Date => {
  const date = new Date();
  date.setDate(1);
  return date;
};

/**
 * Get current ISO string
 */
export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

// ===== DATA PROCESSING UTILITIES =====

/**
 * Sort activities by date (newest first)
 */
export const sortActivitiesByDate = (activities: ActivityFeedItem[]): ActivityFeedItem[] => {
  return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

/**
 * Deduplicate store users (they might be in multiple clubs)
 */
export const deduplicateStoreUsers = (members: any[]): StoreUser[] => {
  const uniqueUsers = new Map();
  
  members?.forEach(member => {
    if (!uniqueUsers.has(member.user_id)) {
      uniqueUsers.set(member.user_id, {
        id: member.users.id,
        username: member.users.username,
        displayname: member.users.displayname,
        account_tier: member.users.account_tier,
        created_at: member.users.created_at,
        first_joined: member.joined_at
      });
    }
  });

  return Array.from(uniqueUsers.values());
};

/**
 * Create empty community metrics
 */
export const createEmptyMetrics = (): CommunityMetrics => ({
  active_members: 0,
  total_clubs: 0,
  recent_discussions: 0,
  books_discussed_this_month: 0,
  new_members_this_month: 0,
});

/**
 * Process discussion data into activity feed items
 */
export const processDiscussionsToActivities = (discussions: any[]): ActivityFeedItem[] => {
  return discussions.map(discussion => ({
    id: discussion.id,
    type: 'discussion' as const,
    title: discussion.title,
    description: `New discussion in ${discussion.book_clubs.name}`,
    user_name: discussion.users.displayname || discussion.users.username,
    club_name: discussion.book_clubs.name,
    created_at: discussion.created_at
  }));
};

/**
 * Process member join data into activity feed items
 */
export const processMemberJoinsToActivities = (members: any[]): ActivityFeedItem[] => {
  return members.map(member => ({
    id: `member-${member.user_id}-${member.club_id}`,
    type: 'member_join' as const,
    title: 'New Member Joined',
    description: `${member.users.displayname || member.users.username} joined ${member.book_clubs.name}`,
    user_name: member.users.displayname || member.users.username,
    club_name: member.book_clubs.name,
    created_at: member.joined_at
  }));
};

// ===== VALIDATION UTILITIES =====

/**
 * Validate store ID
 */
export const validateStoreId = (storeId: string | undefined): boolean => {
  return Boolean(storeId && storeId.trim().length > 0);
};

/**
 * Validate search term
 */
export const validateSearchTerm = (searchTerm: string): boolean => {
  return searchTerm.trim().length >= 2; // Minimum 2 characters for search
};

// ===== TESTIMONIAL UTILITIES =====

/**
 * Calculate next display order for testimonials
 */
export const calculateNextDisplayOrder = (maxOrderData: any[]): number => {
  return maxOrderData && maxOrderData.length > 0
    ? maxOrderData[0].display_order + 1
    : 1;
};

/**
 * Create testimonial reorder updates
 */
export const createReorderUpdates = (testimonialIds: string[]) => {
  return testimonialIds.map((id, index) => ({
    id,
    display_order: index + 1,
    updated_at: getCurrentISOString(),
  }));
};

// ===== ERROR HANDLING UTILITIES =====

/**
 * Check if error is "not found" error
 */
export const isNotFoundError = (error: any): boolean => {
  return error?.code === 'PGRST116';
};

/**
 * Log error with context
 */
export const logErrorWithContext = (context: string, error: any): void => {
  console.error(`Error in ${context}:`, error);
};

// ===== QUERY BUILDING UTILITIES =====

/**
 * Build search query condition for members
 */
export const buildMemberSearchCondition = (searchTerm: string): string => {
  return `users.username.ilike.%${searchTerm}%,users.displayname.ilike.%${searchTerm}%`;
};

/**
 * Build spotlight end date filter condition
 */
export const buildSpotlightDateFilter = (now: string): string => {
  return `spotlight_end_date.is.null,spotlight_end_date.gt.${now}`;
};
