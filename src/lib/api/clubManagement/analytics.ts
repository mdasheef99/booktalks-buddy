/**
 * Club Management Analytics API
 *
 * Basic analytics functions for club management.
 * Phase 1 Foundation implementation.
 */

import { supabase } from '@/lib/supabase';
import { BasicClubAnalytics, ClubAnalyticsSnapshot } from './types';

// =====================================================
// Basic Analytics Functions
// =====================================================

/**
 * Get basic analytics summary for a club
 */
export async function getClubAnalyticsSummary(clubId: string): Promise<BasicClubAnalytics> {
  try {
    // Call the database function
    const { data, error } = await supabase
      .rpc('get_club_analytics_summary', { p_club_id: clubId });

    if (error) throw error;

    const summary = data?.[0] || {
      member_count: 0,
      active_members_week: 0,
      discussion_count: 0,
      posts_count: 0,
      reading_completion_rate: 0
    };

    // Calculate enhanced metrics
    const totalMembers = summary.member_count || 0;
    const activeMembers = summary.active_members_week || 0;
    const totalTopics = summary.discussion_count || 0;
    const totalPosts = summary.posts_count || 0;

    // Calculate engagement score (0-100)
    const engagementScore = totalMembers > 0
      ? Math.min(100, Math.round((activeMembers / totalMembers) * 100))
      : 0;

    // Calculate participation rate
    const participationRate = totalTopics > 0 && totalMembers > 0
      ? Math.min(100, Math.round((activeMembers / totalMembers) * 100))
      : 0;

    // Calculate average posts per topic
    const averagePostsPerTopic = totalTopics > 0
      ? Math.round((totalPosts / totalTopics) * 10) / 10
      : 0;

    // Determine activity trend (simplified for now)
    const activityTrend: 'increasing' | 'stable' | 'decreasing' =
      averagePostsPerTopic >= 5 ? 'increasing' :
      averagePostsPerTopic >= 2 ? 'stable' : 'decreasing';

    // Calculate reading pace (books per month - placeholder)
    const readingPace = 0; // Will be enhanced with actual book data

    // Transform to expected format
    return {
      memberMetrics: {
        totalMembers,
        activeMembersThisWeek: activeMembers,
        newMembersThisMonth: 0, // Will be calculated from snapshots
        memberGrowthTrend: [], // Will be calculated from historical data
        engagementScore,
        retentionRate: 85 // Placeholder - will be calculated from historical data
      },
      discussionMetrics: {
        totalTopics,
        totalPosts,
        postsThisWeek: 0, // Will be calculated from recent posts
        averagePostsPerTopic,
        participationRate,
        activityTrend
      },
      bookMetrics: {
        currentBook: null, // Will be implemented in Phase 4
        booksReadThisYear: 0, // Will be implemented in Phase 4
        averageReadingTime: 0, // Will be implemented in Phase 4
        readingPace,
        completionRate: 0 // Will be implemented in Phase 4
      },
      moderatorAccess: {
        analyticsEnabled: false // Will be determined by user permissions
      },
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching club analytics summary:', error);
    throw new Error('Failed to fetch club analytics summary');
  }
}

/**
 * Create daily analytics snapshot for a club
 */
export async function createDailyAnalyticsSnapshot(clubId: string): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('create_daily_analytics_snapshot', { p_club_id: clubId });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating daily analytics snapshot:', error);
    throw new Error('Failed to create daily analytics snapshot');
  }
}

/**
 * Get analytics snapshots for a club with date range
 */
export async function getClubAnalyticsSnapshots(
  clubId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 30
): Promise<ClubAnalyticsSnapshot[]> {
  try {
    let query = supabase
      .from('club_analytics_snapshots')
      .select('*')
      .eq('club_id', clubId)
      .order('snapshot_date', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('snapshot_date', startDate);
    }

    if (endDate) {
      query = query.lte('snapshot_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching club analytics snapshots:', error);
    throw new Error('Failed to fetch club analytics snapshots');
  }
}

/**
 * Get analytics trends for specific period
 */
export async function getAnalyticsTrends(
  clubId: string,
  period: 'week' | 'month' | 'year'
): Promise<{
  memberGrowth: number[];
  activityTrends: number[];
  engagementMetrics: { date: string; score: number }[];
}> {
  try {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const snapshots = await getClubAnalyticsSnapshots(clubId, undefined, undefined, days);

    return {
      memberGrowth: snapshots.map(s => s.member_count),
      activityTrends: snapshots.map(s => s.posts_this_week),
      engagementMetrics: snapshots.map(s => ({
        date: s.snapshot_date,
        score: s.member_count > 0 ? Math.round((s.active_members_week / s.member_count) * 100) : 0
      }))
    };
  } catch (error) {
    console.error('Error fetching analytics trends:', error);
    throw new Error('Failed to fetch analytics trends');
  }
}
