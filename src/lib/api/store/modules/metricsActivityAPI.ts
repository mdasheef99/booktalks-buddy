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
   * Calculate community metrics from existing data (OPTIMIZED VERSION)
   */
  static async getCommunityMetrics(storeId: string): Promise<CommunityMetrics> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    try {
      // Try optimized single-query approach first
      const optimizedMetrics = await this.getCommunityMetricsOptimized(storeId);
      if (optimizedMetrics) {
        return optimizedMetrics;
      }

      // Fallback to original implementation with improved error handling
      return await this.getCommunityMetricsLegacy(storeId);
    } catch (error) {
      logErrorWithContext('getCommunityMetrics', error);
      return createEmptyMetrics();
    }
  }

  /**
   * Optimized community metrics using single database query
   */
  private static async getCommunityMetricsOptimized(storeId: string): Promise<CommunityMetrics | null> {
    try {
      const thirtyDaysAgo = getThirtyDaysAgo().toISOString();
      const firstOfMonth = getFirstOfMonth().toISOString();

      // Single optimized query using database aggregations
      const { data, error } = await supabase.rpc('get_community_metrics_optimized', {
        p_store_id: storeId,
        p_thirty_days_ago: thirtyDaysAgo,
        p_first_of_month: firstOfMonth
      });

      if (error) {
        console.warn('Optimized metrics query failed, falling back to legacy:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return createEmptyMetrics();
      }

      const metrics = data[0];
      return {
        active_members: metrics.active_members || 0,
        total_clubs: metrics.total_clubs || 0,
        recent_discussions: metrics.recent_discussions || 0,
        books_discussed_this_month: metrics.books_discussed_this_month || 0,
        new_members_this_month: metrics.new_members_this_month || 0,
      };
    } catch (error) {
      console.warn('Optimized metrics failed, falling back to legacy:', error);
      return null;
    }
  }

  /**
   * Legacy community metrics implementation with improved error isolation
   */
  private static async getCommunityMetricsLegacy(storeId: string): Promise<CommunityMetrics> {
    const metrics = createEmptyMetrics();

    try {
      // Get club IDs first
      const { data: storeClubs } = await supabase
        .from(TABLE_NAMES.BOOK_CLUBS)
        .select('id')
        .eq('store_id', storeId);

      const clubIds = storeClubs?.map(club => club.id) || [];

      // Execute metrics queries with individual error handling
      const metricsPromises = [
        this.getActiveMembersCount(clubIds),
        this.getTotalClubsCount(storeId),
        this.getRecentDiscussionsCount(clubIds),
        this.getBooksDiscussedThisMonth(clubIds),
        this.getNewMembersThisMonth(clubIds)
      ];

      const [
        activeMembersCount,
        totalClubsCount,
        recentDiscussionsCount,
        booksDiscussedCount,
        newMembersCount
      ] = await Promise.allSettled(metricsPromises);

      // Extract values with fallbacks for failed promises
      metrics.active_members = activeMembersCount.status === 'fulfilled' ? activeMembersCount.value : 0;
      metrics.total_clubs = totalClubsCount.status === 'fulfilled' ? totalClubsCount.value : 0;
      metrics.recent_discussions = recentDiscussionsCount.status === 'fulfilled' ? recentDiscussionsCount.value : 0;
      metrics.books_discussed_this_month = booksDiscussedCount.status === 'fulfilled' ? booksDiscussedCount.value : 0;
      metrics.new_members_this_month = newMembersCount.status === 'fulfilled' ? newMembersCount.value : 0;

      return metrics;
    } catch (error) {
      logErrorWithContext('getCommunityMetricsLegacy', error);
      return metrics; // Return partial metrics even if some queries failed
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

  // ===== HELPER METHODS FOR LEGACY METRICS =====

  /**
   * Get active members count with error handling
   */
  private static async getActiveMembersCount(clubIds: string[]): Promise<number> {
    if (clubIds.length === 0) return 0;

    const { count, error } = await supabase
      .from(TABLE_NAMES.CLUB_MEMBERS)
      .select('user_id', { count: 'exact', head: true })
      .in('club_id', clubIds);

    if (error) {
      logErrorWithContext('getActiveMembersCount', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get total clubs count with error handling
   */
  private static async getTotalClubsCount(storeId: string): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE_NAMES.BOOK_CLUBS)
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);

    if (error) {
      logErrorWithContext('getTotalClubsCount', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get recent discussions count with error handling
   */
  private static async getRecentDiscussionsCount(clubIds: string[]): Promise<number> {
    if (clubIds.length === 0) return 0;

    const thirtyDaysAgo = getThirtyDaysAgo();
    const { count, error } = await supabase
      .from(TABLE_NAMES.DISCUSSION_TOPICS)
      .select('id', { count: 'exact', head: true })
      .in('club_id', clubIds)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      logErrorWithContext('getRecentDiscussionsCount', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get books discussed this month count with error handling
   */
  private static async getBooksDiscussedThisMonth(clubIds: string[]): Promise<number> {
    if (clubIds.length === 0) return 0;

    const firstOfMonth = getFirstOfMonth();
    const { count, error } = await supabase
      .from(TABLE_NAMES.CURRENT_BOOKS)
      .select('club_id', { count: 'exact', head: true })
      .in('club_id', clubIds)
      .gte('set_at', firstOfMonth.toISOString());

    if (error) {
      logErrorWithContext('getBooksDiscussedThisMonth', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get new members this month count with error handling
   */
  private static async getNewMembersThisMonth(clubIds: string[]): Promise<number> {
    if (clubIds.length === 0) return 0;

    const firstOfMonth = getFirstOfMonth();
    const { count, error } = await supabase
      .from(TABLE_NAMES.CLUB_MEMBERS)
      .select('user_id', { count: 'exact', head: true })
      .in('club_id', clubIds)
      .gte('joined_at', firstOfMonth.toISOString());

    if (error) {
      logErrorWithContext('getNewMembersThisMonth', error);
      return 0;
    }

    return count || 0;
  }
}
