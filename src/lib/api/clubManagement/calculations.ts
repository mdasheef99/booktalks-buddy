/**
 * Analytics Calculation Utilities
 *
 * Functions for calculating trends, insights, and comparative analytics.
 */

import { BasicClubAnalytics, ClubAnalyticsSnapshot, AnalyticsInsight } from './types';

// =====================================================
// Calculation Functions
// =====================================================

/**
 * Calculate engagement metrics from basic analytics and snapshots
 */
export function calculateEngagementMetrics(
  analytics: BasicClubAnalytics,
  snapshots: ClubAnalyticsSnapshot[]
): {
  memberEngagementScore: number;
  discussionParticipationRate: number;
  readingCompletionRate: number;
  overallHealthScore: number;
} {
  const memberEngagementScore = analytics.memberMetrics.engagementScore;
  const discussionParticipationRate = analytics.discussionMetrics.participationRate;
  const readingCompletionRate = analytics.bookMetrics.completionRate;

  // Calculate overall health score (weighted average)
  const overallHealthScore = Math.round(
    (memberEngagementScore * 0.4 +
     discussionParticipationRate * 0.4 +
     readingCompletionRate * 0.2)
  );

  return {
    memberEngagementScore,
    discussionParticipationRate,
    readingCompletionRate,
    overallHealthScore
  };
}

/**
 * Calculate trend analysis from historical snapshots
 */
export function calculateTrendAnalysis(snapshots: ClubAnalyticsSnapshot[]): {
  memberGrowthTrend: 'growing' | 'stable' | 'declining';
  activityTrend: 'increasing' | 'stable' | 'decreasing';
  engagementTrend: 'improving' | 'stable' | 'declining';
} {
  if (snapshots.length < 2) {
    return {
      memberGrowthTrend: 'stable',
      activityTrend: 'stable',
      engagementTrend: 'stable'
    };
  }

  const recent = snapshots.slice(0, 7); // Last 7 days
  const previous = snapshots.slice(7, 14); // Previous 7 days

  const recentAvgMembers = recent.reduce((sum, s) => sum + s.member_count, 0) / recent.length;
  const previousAvgMembers = previous.length > 0
    ? previous.reduce((sum, s) => sum + s.member_count, 0) / previous.length
    : recentAvgMembers;

  const recentAvgPosts = recent.reduce((sum, s) => sum + s.posts_this_week, 0) / recent.length;
  const previousAvgPosts = previous.length > 0
    ? previous.reduce((sum, s) => sum + s.posts_this_week, 0) / previous.length
    : recentAvgPosts;

  const recentAvgEngagement = recent.reduce((sum, s) =>
    sum + (s.member_count > 0 ? (s.active_members_week / s.member_count) * 100 : 0), 0
  ) / recent.length;
  const previousAvgEngagement = previous.length > 0
    ? previous.reduce((sum, s) =>
        sum + (s.member_count > 0 ? (s.active_members_week / s.member_count) * 100 : 0), 0
      ) / previous.length
    : recentAvgEngagement;

  return {
    memberGrowthTrend:
      recentAvgMembers > previousAvgMembers * 1.05 ? 'growing' :
      recentAvgMembers < previousAvgMembers * 0.95 ? 'declining' : 'stable',
    activityTrend:
      recentAvgPosts > previousAvgPosts * 1.1 ? 'increasing' :
      recentAvgPosts < previousAvgPosts * 0.9 ? 'decreasing' : 'stable',
    engagementTrend:
      recentAvgEngagement > previousAvgEngagement * 1.05 ? 'improving' :
      recentAvgEngagement < previousAvgEngagement * 0.95 ? 'declining' : 'stable'
  };
}

/**
 * Calculate comparative periods from snapshots
 */
export function calculateComparativePeriods(snapshots: ClubAnalyticsSnapshot[]): {
  previousWeek: Partial<BasicClubAnalytics>;
  previousMonth: Partial<BasicClubAnalytics>;
  yearOverYear: Partial<BasicClubAnalytics>;
} {
  const weekAgo = snapshots.find(s => {
    const date = new Date(s.snapshot_date);
    const weekAgoDate = new Date();
    weekAgoDate.setDate(weekAgoDate.getDate() - 7);
    return date.toDateString() === weekAgoDate.toDateString();
  });

  const monthAgo = snapshots.find(s => {
    const date = new Date(s.snapshot_date);
    const monthAgoDate = new Date();
    monthAgoDate.setMonth(monthAgoDate.getMonth() - 1);
    return Math.abs(date.getTime() - monthAgoDate.getTime()) < 24 * 60 * 60 * 1000;
  });

  return {
    previousWeek: weekAgo ? {
      memberMetrics: {
        totalMembers: weekAgo.member_count,
        activeMembersThisWeek: weekAgo.active_members_week,
        newMembersThisMonth: 0,
        memberGrowthTrend: [],
        engagementScore: weekAgo.member_count > 0
          ? Math.round((weekAgo.active_members_week / weekAgo.member_count) * 100)
          : 0,
        retentionRate: 0
      }
    } : {},
    previousMonth: monthAgo ? {
      memberMetrics: {
        totalMembers: monthAgo.member_count,
        activeMembersThisWeek: monthAgo.active_members_week,
        newMembersThisMonth: 0,
        memberGrowthTrend: [],
        engagementScore: monthAgo.member_count > 0
          ? Math.round((monthAgo.active_members_week / monthAgo.member_count) * 100)
          : 0,
        retentionRate: 0
      }
    } : {},
    yearOverYear: {} // Placeholder for year-over-year comparison
  };
}

/**
 * Generate analytics insights
 */
export function generateAnalyticsInsights(
  analytics: BasicClubAnalytics,
  trends: {
    memberGrowthTrend: 'growing' | 'stable' | 'declining';
    activityTrend: 'increasing' | 'stable' | 'decreasing';
    engagementTrend: 'improving' | 'stable' | 'declining';
  }
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  // Member insights
  if (analytics.memberMetrics.engagementScore >= 70) {
    insights.push({
      type: 'positive',
      category: 'members',
      title: 'Excellent Member Engagement',
      description: `${analytics.memberMetrics.engagementScore}% of members are actively participating`,
      recommendation: 'Keep up the great work! Consider sharing success strategies with other clubs.'
    });
  } else if (analytics.memberMetrics.engagementScore < 30) {
    insights.push({
      type: 'warning',
      category: 'members',
      title: 'Low Member Engagement',
      description: `Only ${analytics.memberMetrics.engagementScore}% of members are actively participating`,
      recommendation: 'Try hosting interactive events or discussion prompts to boost engagement.'
    });
  }

  // Discussion insights
  if (analytics.discussionMetrics.averagePostsPerTopic >= 10) {
    insights.push({
      type: 'positive',
      category: 'discussions',
      title: 'Vibrant Discussions',
      description: `Average of ${analytics.discussionMetrics.averagePostsPerTopic} posts per topic shows great engagement`,
      recommendation: 'Your discussion topics are resonating well with members!'
    });
  } else if (analytics.discussionMetrics.averagePostsPerTopic < 3) {
    insights.push({
      type: 'warning',
      category: 'discussions',
      title: 'Limited Discussion Activity',
      description: `Only ${analytics.discussionMetrics.averagePostsPerTopic} posts per topic on average`,
      recommendation: 'Try asking thought-provoking questions or sharing interesting quotes to spark discussion.'
    });
  }

  // Trend insights
  if (trends.memberGrowthTrend === 'growing') {
    insights.push({
      type: 'positive',
      category: 'members',
      title: 'Growing Membership',
      description: 'Your club is attracting new members consistently',
      recommendation: 'Consider creating a welcome process for new members.'
    });
  } else if (trends.memberGrowthTrend === 'declining') {
    insights.push({
      type: 'warning',
      category: 'members',
      title: 'Declining Membership',
      description: 'Member count has been decreasing recently',
      recommendation: 'Survey members to understand concerns and improve the club experience.'
    });
  }

  return insights;
}
