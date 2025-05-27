/**
 * Metrics and Activity API Module
 * Handles community metrics and activity feed operations
 */

import { supabase } from '@/lib/supabase';
import type {
  CommunityMetrics,
  ActivityFeedItem
} from '../types/communityShowcaseTypes';
import {
  TABLE_NAMES,
  QUERY_SELECTORS,
  QUERY_LIMITS
} from '../constants/communityShowcaseConstants';
import {
  getThirtyDaysAgo,
  getFirstOfMonth,
  createEmptyMetrics,
  processDiscussionsToActivities,
  processMemberJoinsToActivities,
  sortActivitiesByDate,
  validateStoreId,
  logErrorWithContext
} from '../utils/communityShowcaseUtils';

/**
 * Metrics and Activity API operations
 */
export class MetricsActivityAPI {
  /**
   * Calculate community metrics from existing data
   */
  static async getCommunityMetrics(storeId: string): Promise<CommunityMetrics> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    try {
      // Get active members count - first get club IDs, then count members
      const { data: storeClubs } = await supabase
        .from(TABLE_NAMES.BOOK_CLUBS)
        .select('id')
        .eq('store_id', storeId);

      const clubIds = storeClubs?.map(club => club.id) || [];

      let activeMembersCount = 0;
      if (clubIds.length > 0) {
        const { count } = await supabase
          .from(TABLE_NAMES.CLUB_MEMBERS)
          .select('user_id', { count: 'exact', head: true })
          .in('club_id', clubIds);
        activeMembersCount = count || 0;
      }

      // Get total clubs count
      const { count: totalClubsCount } = await supabase
        .from(TABLE_NAMES.BOOK_CLUBS)
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId);

      // Get recent discussions count (last 30 days)
      const thirtyDaysAgo = getThirtyDaysAgo();

      let recentDiscussionsCount = 0;
      if (clubIds.length > 0) {
        const { count } = await supabase
          .from(TABLE_NAMES.DISCUSSION_TOPICS)
          .select('id', { count: 'exact', head: true })
          .in('club_id', clubIds)
          .gte('created_at', thirtyDaysAgo.toISOString());
        recentDiscussionsCount = count || 0;
      }

      // Get books discussed this month (from current_books)
      const firstOfMonth = getFirstOfMonth();

      let booksDiscussedCount = 0;
      if (clubIds.length > 0) {
        const { count } = await supabase
          .from(TABLE_NAMES.CURRENT_BOOKS)
          .select('club_id', { count: 'exact', head: true })
          .in('club_id', clubIds)
          .gte('set_at', firstOfMonth.toISOString());
        booksDiscussedCount = count || 0;
      }

      // Get new members this month
      let newMembersCount = 0;
      if (clubIds.length > 0) {
        const { count } = await supabase
          .from(TABLE_NAMES.CLUB_MEMBERS)
          .select('user_id', { count: 'exact', head: true })
          .in('club_id', clubIds)
          .gte('joined_at', firstOfMonth.toISOString());
        newMembersCount = count || 0;
      }

      return {
        active_members: activeMembersCount,
        total_clubs: totalClubsCount || 0,
        recent_discussions: recentDiscussionsCount,
        books_discussed_this_month: booksDiscussedCount,
        new_members_this_month: newMembersCount,
      };
    } catch (error) {
      logErrorWithContext('getCommunityMetrics', error);
      return createEmptyMetrics();
    }
  }

  /**
   * Get recent community activity feed
   */
  static async getRecentActivity(storeId: string, limit: number = QUERY_LIMITS.DEFAULT_ACTIVITY_FEED): Promise<ActivityFeedItem[]> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    try {
      const activities: ActivityFeedItem[] = [];

      // First get club IDs for this store
      const { data: storeClubs } = await supabase
        .from(TABLE_NAMES.BOOK_CLUBS)
        .select('id')
        .eq('store_id', storeId);

      const clubIds = storeClubs?.map(club => club.id) || [];

      if (clubIds.length === 0) {
        return []; // No clubs, no activities
      }

      // Get recent discussion topics
      const { data: discussions } = await supabase
        .from(TABLE_NAMES.DISCUSSION_TOPICS)
        .select(`
          id,
          title,
          created_at,
          user_id,
          club_id,
          book_clubs!inner(name),
          users!inner(username, displayname)
        `)
        .in('club_id', clubIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (discussions) {
        activities.push(...processDiscussionsToActivities(discussions));
      }

      // Get recent member joins
      const { data: newMembers } = await supabase
        .from(TABLE_NAMES.CLUB_MEMBERS)
        .select(`
          user_id,
          joined_at,
          club_id,
          book_clubs!inner(name),
          users!inner(username, displayname)
        `)
        .in('club_id', clubIds)
        .order('joined_at', { ascending: false })
        .limit(limit);

      if (newMembers) {
        activities.push(...processMemberJoinsToActivities(newMembers));
      }

      // Sort all activities by date and limit
      return sortActivitiesByDate(activities).slice(0, limit);

    } catch (error) {
      logErrorWithContext('getRecentActivity', error);
      return [];
    }
  }
}
