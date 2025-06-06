/**
 * Enhanced Analytics API
 *
 * Phase 2 Week 4 enhanced analytics functions with trends and insights.
 */

import { EnhancedAnalytics } from './types';
import { getClubAnalyticsSummary, getClubAnalyticsSnapshots } from './analytics';
import { calculateEngagementMetrics, calculateTrendAnalysis, calculateComparativePeriods, generateAnalyticsInsights } from './calculations';

// =====================================================
// Enhanced Analytics Functions
// =====================================================

/**
 * Get enhanced analytics with trends and insights
 */
export async function getEnhancedAnalytics(clubId: string): Promise<EnhancedAnalytics> {
  try {
    // Get basic analytics first
    const basicAnalytics = await getClubAnalyticsSummary(clubId);

    // Get historical data for trends
    const snapshots = await getClubAnalyticsSnapshots(clubId, undefined, undefined, 30);

    // Calculate engagement metrics
    const engagementMetrics = calculateEngagementMetrics(basicAnalytics, snapshots);

    // Calculate trend analysis
    const trendAnalysis = calculateTrendAnalysis(snapshots);

    // Get comparative periods
    const comparativePeriods = calculateComparativePeriods(snapshots);

    // Generate insights
    const insights = generateAnalyticsInsights(basicAnalytics, trendAnalysis);

    return {
      ...basicAnalytics,
      engagementMetrics,
      trendAnalysis,
      comparativePeriods,
      insights
    };
  } catch (error) {
    console.error('Error fetching enhanced analytics:', error);
    throw new Error('Failed to fetch enhanced analytics');
  }
}
