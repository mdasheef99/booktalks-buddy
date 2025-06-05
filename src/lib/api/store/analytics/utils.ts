/**
 * Analytics Utilities
 *
 * Shared utility functions for analytics operations
 */

import { supabase } from '@/lib/supabase';
import { getAnalyticsSummary } from './metrics-collection';
import type { SimpleMetrics } from './types';

/**
 * Check if analytics data exists for a store
 */
export async function hasAnalyticsData(storeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('store_landing_analytics')
      .select('id')
      .eq('store_id', storeId)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking analytics data:', error);
    return false;
  }
}



/**
 * Format analytics numbers for display
 */
export function formatAnalyticsNumber(value: number, type: 'count' | 'percentage' | 'duration' = 'count'): string {
  switch (type) {
    case 'count':
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toString();
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'duration':
      if (value >= 3600) {
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        return `${hours}h ${minutes}m`;
      } else if (value >= 60) {
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}m ${seconds}s`;
      }
      return `${value}s`;
    
    default:
      return value.toString();
  }
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): {
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
} {
  const value = current - previous;
  const percentage = previous > 0 ? Math.round((value / previous) * 100) : 0;
  
  let trend: 'up' | 'down' | 'stable';
  if (percentage > 5) trend = 'up';
  else if (percentage < -5) trend = 'down';
  else trend = 'stable';

  return { value, percentage, trend };
}

/**
 * Get analytics date range options
 */
export function getDateRangeOptions(): Array<{
  label: string;
  value: number;
  description: string;
}> {
  return [
    { label: 'Last 7 days', value: 7, description: 'Recent performance' },
    { label: 'Last 30 days', value: 30, description: 'Monthly overview' },
    { label: 'Last 90 days', value: 90, description: 'Quarterly trends' },
    { label: 'Last 365 days', value: 365, description: 'Annual performance' }
  ];
}

/**
 * Validate analytics query parameters
 */
export function validateAnalyticsParams(params: {
  storeId?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.storeId) {
    errors.push('Store ID is required');
  }

  if (params.days && (params.days < 1 || params.days > 365)) {
    errors.push('Days must be between 1 and 365');
  }

  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    
    if (start > end) {
      errors.push('Start date must be before end date');
    }
    
    if (end > new Date()) {
      errors.push('End date cannot be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate analytics export data
 */
export async function generateAnalyticsExport(
  storeId: string, 
  days: number = 30
): Promise<{
  summary: any;
  rawData: any[];
  exportDate: string;
  period: string;
}> {
  try {
    const [summary, rawData] = await Promise.all([
      getAnalyticsSummary(storeId, days),
      getRawAnalyticsData(storeId, days)
    ]);

    return {
      summary,
      rawData,
      exportDate: new Date().toISOString(),
      period: `${days} days`
    };
  } catch (error) {
    console.error('Error generating analytics export:', error);
    throw error;
  }
}

/**
 * Get raw analytics data for export
 */
async function getRawAnalyticsData(storeId: string, days: number): Promise<any[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('store_landing_analytics')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting raw analytics data:', error);
    return [];
  }
}

/**
 * Calculate analytics health score
 */
export function calculateHealthScore(metrics: {
  pageViews: number;
  bounceRate: number;
  engagementRate: number;
  conversionRate: number;
}): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    traffic: number;
    retention: number;
    engagement: number;
    conversion: number;
  };
} {
  // Calculate individual factor scores (0-100)
  const traffic = Math.min(metrics.pageViews / 10, 100); // 1000+ page views = 100 points
  const retention = Math.max(100 - metrics.bounceRate, 0); // Lower bounce rate = higher score
  const engagement = Math.min(metrics.engagementRate * 4, 100); // 25%+ engagement = 100 points
  const conversion = Math.min(metrics.conversionRate * 10, 100); // 10%+ conversion = 100 points

  // Calculate overall score
  const score = Math.round((traffic + retention + engagement + conversion) / 4);

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
      retention,
      engagement,
      conversion
    }
  };
}

/**
 * Get analytics insights based on data patterns
 */
export function getAnalyticsInsights(summary: any): Array<{
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  actionable: boolean;
}> {
  const insights = [];

  // Traffic insights
  if (summary.totalPageViews > 1000) {
    insights.push({
      type: 'positive' as const,
      title: 'Strong Traffic Volume',
      description: `Your page received ${summary.totalPageViews} views, indicating good visibility.`,
      actionable: false
    });
  } else if (summary.totalPageViews < 50) {
    insights.push({
      type: 'negative' as const,
      title: 'Low Traffic Volume',
      description: 'Consider implementing SEO improvements or marketing campaigns.',
      actionable: true
    });
  }

  // Engagement insights
  const engagementRate = summary.totalPageViews > 0 ? 
    ((summary.totalChatClicks + summary.totalCarouselInteractions + summary.totalBannerClicks) / summary.totalPageViews) * 100 : 0;

  if (engagementRate > 20) {
    insights.push({
      type: 'positive' as const,
      title: 'High Engagement Rate',
      description: `${engagementRate.toFixed(1)}% engagement rate shows visitors are actively interacting.`,
      actionable: false
    });
  } else if (engagementRate < 5) {
    insights.push({
      type: 'negative' as const,
      title: 'Low Engagement Rate',
      description: 'Consider making interactive elements more prominent or compelling.',
      actionable: true
    });
  }

  // Mobile insights
  if (summary.mobileVsDesktopRatio.mobile > 80) {
    insights.push({
      type: 'neutral' as const,
      title: 'Mobile-First Audience',
      description: `${summary.mobileVsDesktopRatio.mobile}% of traffic is mobile. Ensure optimal mobile experience.`,
      actionable: true
    });
  }

  return insights;
}
