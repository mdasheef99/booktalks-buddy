/**
 * Summary Analytics Module
 * 
 * Handles analytics summary calculations and aggregations
 */

import { getAnalyticsSummary, getUniqueSessionCount, calculateBounceRate } from './metrics-collection';
import type { AnalyticsSummary, SimpleMetrics } from './types';

/**
 * Get enhanced analytics summary with calculated metrics
 */
export async function getEnhancedSummary(storeId: string, days: number = 30): Promise<AnalyticsSummary> {
  try {
    // Get base summary
    const baseSummary = await getAnalyticsSummary(storeId, days);
    
    // Calculate enhanced metrics
    const [bounceRate, sessionCount] = await Promise.all([
      calculateBounceRate(storeId, days),
      getUniqueSessionCount(storeId, days)
    ]);

    // Calculate average session duration (simplified)
    const avgSessionDuration = baseSummary.totalPageViews > 0 ? 
      Math.round((baseSummary.totalPageViews * 45) / sessionCount) : 0; // Estimated 45 seconds per page view

    // Calculate average time on page (simplified)
    const avgTimeOnPage = baseSummary.totalPageViews > 0 ? 
      Math.round(avgSessionDuration * 0.7) : 0; // Estimated 70% of session duration

    return {
      ...baseSummary,
      averageBounceRate: bounceRate,
      averageTimeOnPage: avgTimeOnPage,
      averageSessionDuration: avgSessionDuration
    };
  } catch (error) {
    console.error('Error getting enhanced summary:', error);
    return getAnalyticsSummary(storeId, days); // Fallback to basic summary
  }
}

/**
 * Get simple metrics for dashboard display
 */
export async function getSimpleMetrics(storeId: string, days: number = 7): Promise<SimpleMetrics> {
  try {
    const summary = await getEnhancedSummary(storeId, days);

    return {
      pageViews: summary.totalPageViews,
      chatClicks: summary.totalChatClicks,
      bounceRate: Math.round(summary.averageBounceRate),
      hasData: summary.totalPageViews > 0
    };
  } catch (error) {
    console.error('Error fetching simple metrics:', error);
    return {
      pageViews: 0,
      chatClicks: 0,
      bounceRate: 0,
      hasData: false
    };
  }
}

/**
 * Get comparative analytics (current vs previous period)
 */
export async function getComparativeAnalytics(storeId: string, days: number = 30): Promise<{
  current: AnalyticsSummary;
  previous: AnalyticsSummary;
  changes: {
    pageViews: { value: number; percentage: number };
    uniqueVisitors: { value: number; percentage: number };
    bounceRate: { value: number; percentage: number };
    chatClicks: { value: number; percentage: number };
  };
}> {
  try {
    const [current, previous] = await Promise.all([
      getEnhancedSummary(storeId, days),
      getEnhancedSummary(storeId, days * 2) // Get data for double the period to compare
    ]);

    // Calculate changes
    const calculateChange = (current: number, previous: number) => {
      const value = current - previous;
      const percentage = previous > 0 ? Math.round((value / previous) * 100) : 0;
      return { value, percentage };
    };

    return {
      current,
      previous,
      changes: {
        pageViews: calculateChange(current.totalPageViews, previous.totalPageViews),
        uniqueVisitors: calculateChange(current.totalUniqueVisitors, previous.totalUniqueVisitors),
        bounceRate: calculateChange(current.averageBounceRate, previous.averageBounceRate),
        chatClicks: calculateChange(current.totalChatClicks, previous.totalChatClicks)
      }
    };
  } catch (error) {
    console.error('Error getting comparative analytics:', error);
    const emptySummary: AnalyticsSummary = {
      totalPageViews: 0,
      totalUniqueVisitors: 0,
      averageBounceRate: 0,
      averageTimeOnPage: 0,
      totalChatClicks: 0,
      totalCarouselInteractions: 0,
      totalBannerClicks: 0,
      returnVisitorRate: 0,
      averageSessionDuration: 0,
      mobileVsDesktopRatio: { mobile: 0, desktop: 0 },
      period: `${days} days`
    };

    return {
      current: emptySummary,
      previous: emptySummary,
      changes: {
        pageViews: { value: 0, percentage: 0 },
        uniqueVisitors: { value: 0, percentage: 0 },
        bounceRate: { value: 0, percentage: 0 },
        chatClicks: { value: 0, percentage: 0 }
      }
    };
  }
}

/**
 * Get top performing metrics
 */
export async function getTopMetrics(storeId: string, days: number = 30): Promise<{
  topMetric: string;
  topValue: number;
  metrics: Array<{
    name: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}> {
  try {
    const summary = await getEnhancedSummary(storeId, days);
    
    const metrics = [
      { name: 'Page Views', value: summary.totalPageViews, trend: 'stable' as const },
      { name: 'Unique Visitors', value: summary.totalUniqueVisitors, trend: 'stable' as const },
      { name: 'Chat Clicks', value: summary.totalChatClicks, trend: 'stable' as const },
      { name: 'Carousel Interactions', value: summary.totalCarouselInteractions, trend: 'stable' as const },
      { name: 'Banner Clicks', value: summary.totalBannerClicks, trend: 'stable' as const }
    ];

    // Find top performing metric
    const topMetric = metrics.reduce((prev, current) => 
      current.value > prev.value ? current : prev
    );

    return {
      topMetric: topMetric.name,
      topValue: topMetric.value,
      metrics
    };
  } catch (error) {
    console.error('Error getting top metrics:', error);
    return {
      topMetric: 'No Data',
      topValue: 0,
      metrics: []
    };
  }
}

/**
 * Get engagement metrics
 */
export async function getEngagementMetrics(storeId: string, days: number = 30): Promise<{
  engagementRate: number;
  interactionRate: number;
  conversionRate: number;
  averageEngagementTime: number;
}> {
  try {
    const summary = await getEnhancedSummary(storeId, days);
    
    // Calculate engagement metrics
    const totalInteractions = summary.totalChatClicks + 
                             summary.totalCarouselInteractions + 
                             summary.totalBannerClicks;
    
    const engagementRate = summary.totalPageViews > 0 ? 
      Math.round((totalInteractions / summary.totalPageViews) * 100) : 0;
    
    const interactionRate = summary.totalUniqueVisitors > 0 ? 
      Math.round((totalInteractions / summary.totalUniqueVisitors) * 100) : 0;
    
    // Simplified conversion rate (chat clicks as conversions)
    const conversionRate = summary.totalPageViews > 0 ? 
      Math.round((summary.totalChatClicks / summary.totalPageViews) * 100) : 0;

    return {
      engagementRate,
      interactionRate,
      conversionRate,
      averageEngagementTime: summary.averageTimeOnPage
    };
  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    return {
      engagementRate: 0,
      interactionRate: 0,
      conversionRate: 0,
      averageEngagementTime: 0
    };
  }
}

/**
 * Get performance score
 */
export async function getPerformanceScore(storeId: string, days: number = 30): Promise<{
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    traffic: number;
    engagement: number;
    retention: number;
    conversion: number;
  };
}> {
  try {
    const [summary, engagement] = await Promise.all([
      getEnhancedSummary(storeId, days),
      getEngagementMetrics(storeId, days)
    ]);

    // Calculate individual factor scores (0-100)
    const traffic = Math.min(summary.totalPageViews * 2, 100); // 50+ page views = 100 points
    const engagementScore = Math.min(engagement.engagementRate * 2, 100); // 50%+ engagement = 100 points
    const retention = Math.max(100 - summary.averageBounceRate, 0); // Lower bounce rate = higher score
    const conversion = Math.min(engagement.conversionRate * 10, 100); // 10%+ conversion = 100 points

    // Calculate overall score
    const score = Math.round((traffic + engagementScore + retention + conversion) / 4);

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      score,
      grade,
      factors: {
        traffic,
        engagement: engagementScore,
        retention,
        conversion
      }
    };
  } catch (error) {
    console.error('Error getting performance score:', error);
    return {
      score: 0,
      grade: 'F',
      factors: {
        traffic: 0,
        engagement: 0,
        retention: 0,
        conversion: 0
      }
    };
  }
}
