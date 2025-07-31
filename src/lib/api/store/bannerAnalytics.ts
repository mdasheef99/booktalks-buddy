/**
 * Banner Analytics API
 * 
 * Comprehensive multi-banner analytics API following BookTalks Buddy patterns
 * Provides detailed analytics for promotional banner performance
 */

import { supabase } from '@/lib/supabase';

// =========================
// Type Definitions
// =========================

export interface MultiBannerAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  overallCTR: number;
  activeBannersCount: number;
  topPerformingBannerId: string;
  worstPerformingBannerId: string;
  avgCTRAllBanners: number;
  totalSessions: number;
  uniqueVisitors: number;
  period: string;
}

export interface BannerPerformanceDetail {
  bannerId: string;
  bannerTitle: string;
  impressions: number;
  clicks: number;
  ctr: number;
  performanceRank: number;
  performancePercentile: number;
  sessions: number;
  uniqueVisitors: number;
  avgViewDuration: number;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

export interface BannerTimeSeriesData {
  timePeriod: string;
  bannerId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  uniqueSessions: number;
}

export interface BannerComparisonData {
  bannerId: string;
  bannerTitle: string;
  impressions: number;
  clicks: number;
  ctr: number;
  performanceScore: number;
  engagementRate: number;
  conversionRate: number;
}

export interface BannerAnalyticsOptions {
  storeId: string;
  days?: number;
  bannerIds?: string[];
  intervalType?: 'hour' | 'day' | 'week';
}

// =========================
// Multi-Banner Analytics API Class
// =========================

export class MultiBannerAnalyticsAPI {
  /**
   * Get comprehensive multi-banner analytics summary
   */
  static async getAnalyticsSummary(
    storeId: string, 
    days: number = 30
  ): Promise<MultiBannerAnalyticsSummary> {
    try {
      const { data, error } = await supabase
        .rpc('get_multi_banner_analytics_summary', {
          p_store_id: storeId,
          p_days_back: days
        });

      if (error) {
        console.error('Error fetching banner analytics summary:', error);
        throw error;
      }

      const result = data?.[0] || {};
      
      return {
        totalImpressions: Number(result.total_impressions || 0),
        totalClicks: Number(result.total_clicks || 0),
        overallCTR: Number(result.overall_ctr || 0),
        activeBannersCount: Number(result.active_banners_count || 0),
        topPerformingBannerId: result.top_performing_banner_id || 'None',
        worstPerformingBannerId: result.worst_performing_banner_id || 'None',
        avgCTRAllBanners: Number(result.avg_ctr_all_banners || 0),
        totalSessions: Number(result.total_sessions || 0),
        uniqueVisitors: Number(result.unique_visitors || 0),
        period: `${days} days`
      };
    } catch (error) {
      console.error('Banner analytics summary failed:', error);
      return {
        totalImpressions: 0,
        totalClicks: 0,
        overallCTR: 0,
        activeBannersCount: 0,
        topPerformingBannerId: 'None',
        worstPerformingBannerId: 'None',
        avgCTRAllBanners: 0,
        totalSessions: 0,
        uniqueVisitors: 0,
        period: `${days} days`
      };
    }
  }

  /**
   * Get individual banner performance with ranking
   */
  static async getBannerPerformanceWithRanking(
    storeId: string, 
    days: number = 30
  ): Promise<BannerPerformanceDetail[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_banner_performance_with_ranking', {
          p_store_id: storeId,
          p_days_back: days
        });

      if (error) {
        console.error('Error fetching banner performance ranking:', error);
        throw error;
      }

      return (data || []).map((banner: any) => {
        const ctr = Number(banner.ctr || 0);
        let performance: 'excellent' | 'good' | 'average' | 'poor';
        
        if (ctr >= 10) performance = 'excellent';
        else if (ctr >= 5) performance = 'good';
        else if (ctr >= 2) performance = 'average';
        else performance = 'poor';

        return {
          bannerId: banner.banner_id,
          bannerTitle: banner.banner_title || 'Unknown Banner',
          impressions: Number(banner.impressions || 0),
          clicks: Number(banner.clicks || 0),
          ctr: ctr,
          performanceRank: Number(banner.performance_rank || 0),
          performancePercentile: Number(banner.performance_percentile || 0),
          sessions: Number(banner.sessions || 0),
          uniqueVisitors: Number(banner.unique_visitors || 0),
          avgViewDuration: Number(banner.avg_view_duration || 0),
          deviceBreakdown: banner.device_breakdown || { mobile: 0, desktop: 0, tablet: 0 },
          performance
        };
      });
    } catch (error) {
      console.error('Banner performance ranking failed:', error);
      return [];
    }
  }

  /**
   * Get banner time series data for trends
   */
  static async getBannerTimeSeriesData(
    storeId: string, 
    days: number = 30,
    intervalType: 'hour' | 'day' | 'week' = 'day'
  ): Promise<BannerTimeSeriesData[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_banner_time_series_data', {
          p_store_id: storeId,
          p_days_back: days,
          p_interval_type: intervalType
        });

      if (error) {
        console.error('Error fetching banner time series data:', error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        timePeriod: item.time_period,
        bannerId: item.banner_id,
        impressions: Number(item.impressions || 0),
        clicks: Number(item.clicks || 0),
        ctr: Number(item.ctr || 0),
        uniqueSessions: Number(item.unique_sessions || 0)
      }));
    } catch (error) {
      console.error('Banner time series data failed:', error);
      return [];
    }
  }

  /**
   * Get banner comparison data
   */
  static async getBannerComparisonData(
    storeId: string, 
    bannerIds?: string[], 
    days: number = 30
  ): Promise<BannerComparisonData[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_banner_comparison_data', {
          p_store_id: storeId,
          p_banner_ids: bannerIds || null,
          p_days_back: days
        });

      if (error) {
        console.error('Error fetching banner comparison data:', error);
        throw error;
      }

      return (data || []).map((banner: any) => ({
        bannerId: banner.banner_id,
        bannerTitle: banner.banner_title || 'Unknown Banner',
        impressions: Number(banner.impressions || 0),
        clicks: Number(banner.clicks || 0),
        ctr: Number(banner.ctr || 0),
        performanceScore: Number(banner.performance_score || 0),
        engagementRate: Number(banner.engagement_rate || 0),
        conversionRate: Number(banner.conversion_rate || 0)
      }));
    } catch (error) {
      console.error('Banner comparison data failed:', error);
      return [];
    }
  }

  /**
   * Export banner analytics data (JSON format)
   */
  static async exportAnalyticsData(
    storeId: string, 
    days: number = 30,
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    try {
      const [summary, performance, timeSeries] = await Promise.all([
        this.getAnalyticsSummary(storeId, days),
        this.getBannerPerformanceWithRanking(storeId, days),
        this.getBannerTimeSeriesData(storeId, days)
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        storeId,
        period: `${days} days`,
        summary,
        bannerPerformance: performance,
        timeSeriesData: timeSeries
      };

      if (format === 'json') {
        return exportData;
      }

      // CSV format conversion (simplified)
      if (format === 'csv') {
        const csvData = performance.map(banner => ({
          'Banner ID': banner.bannerId,
          'Banner Title': banner.bannerTitle,
          'Impressions': banner.impressions,
          'Clicks': banner.clicks,
          'CTR (%)': banner.ctr,
          'Performance Rank': banner.performanceRank,
          'Sessions': banner.sessions,
          'Unique Visitors': banner.uniqueVisitors,
          'Performance': banner.performance
        }));
        return csvData;
      }

      return exportData;
    } catch (error) {
      console.error('Export analytics data failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics for dashboard
   */
  static async getComprehensiveAnalytics(
    storeId: string, 
    days: number = 30
  ): Promise<{
    summary: MultiBannerAnalyticsSummary;
    bannerPerformance: BannerPerformanceDetail[];
    timeSeriesData: BannerTimeSeriesData[];
    comparisonData: BannerComparisonData[];
  }> {
    try {
      const [summary, performance, timeSeries, comparison] = await Promise.all([
        this.getAnalyticsSummary(storeId, days),
        this.getBannerPerformanceWithRanking(storeId, days),
        this.getBannerTimeSeriesData(storeId, days),
        this.getBannerComparisonData(storeId, undefined, days)
      ]);

      return {
        summary,
        bannerPerformance: performance,
        timeSeriesData: timeSeries,
        comparisonData: comparison
      };
    } catch (error) {
      console.error('Comprehensive analytics failed:', error);
      throw error;
    }
  }
}

// =========================
// Utility Functions
// =========================

/**
 * Format CTR for display
 */
export function formatCTR(ctr: number): string {
  return `${ctr.toFixed(2)}%`;
}

/**
 * Format large numbers for display
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Get performance color based on CTR
 */
export function getPerformanceColor(performance: string): string {
  switch (performance) {
    case 'excellent': return 'text-green-600 bg-green-100';
    case 'good': return 'text-blue-600 bg-blue-100';
    case 'average': return 'text-yellow-600 bg-yellow-100';
    case 'poor': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

// Export the main API class as default
export default MultiBannerAnalyticsAPI;
