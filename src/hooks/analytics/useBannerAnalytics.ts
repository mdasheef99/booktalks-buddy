/**
 * Banner Analytics Hook
 * 
 * Custom hook for banner analytics data management
 * Follows established BookTalks Buddy analytics patterns
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MultiBannerAnalyticsAPI } from '@/lib/api/store/bannerAnalytics';
import type { 
  MultiBannerAnalyticsSummary, 
  BannerPerformanceDetail, 
  BannerTimeSeriesData,
  BannerComparisonData 
} from '@/lib/api/store/bannerAnalytics';

// =========================
// Hook Options Interface
// =========================

interface UseBannerAnalyticsOptions {
  storeId: string;
  initialTimeRange?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// =========================
// Hook Return Interface
// =========================

interface UseBannerAnalyticsReturn {
  // Analytics data
  summary: MultiBannerAnalyticsSummary | undefined;
  bannerPerformance: BannerPerformanceDetail[];
  timeSeriesData: BannerTimeSeriesData[];
  comparisonData: BannerComparisonData[];
  
  // Loading states
  isLoading: boolean;
  summaryLoading: boolean;
  performanceLoading: boolean;
  timeSeriesLoading: boolean;
  comparisonLoading: boolean;
  
  // Error states
  summaryError: Error | null;
  performanceError: Error | null;
  timeSeriesError: Error | null;
  comparisonError: Error | null;
  hasErrors: boolean;
  
  // Time range management
  timeRange: number;
  setTimeRange: (days: number) => void;
  
  // Actions
  refetchSummary: () => void;
  refetchPerformance: () => void;
  refetchTimeSeries: () => void;
  refetchComparison: () => void;
  refetchAll: () => void;
  
  // Export functionality
  exportData: (format?: 'json' | 'csv') => Promise<any>;
  isExporting: boolean;
  
  // Utility functions
  getTopPerformingBanners: (limit?: number) => BannerPerformanceDetail[];
  getPoorPerformingBanners: (limit?: number) => BannerPerformanceDetail[];
  getBannerById: (bannerId: string) => BannerPerformanceDetail | undefined;
}

// =========================
// Main Hook Implementation
// =========================

/**
 * Custom hook for Banner Analytics data management
 * Handles data fetching, state management, and provides convenient actions
 */
export const useBannerAnalytics = ({
  storeId,
  initialTimeRange = 30,
  autoRefresh = false,
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}: UseBannerAnalyticsOptions): UseBannerAnalyticsReturn => {
  // State management
  const [timeRange, setTimeRange] = useState<number>(initialTimeRange);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch analytics summary
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ['banner-analytics-summary', storeId, timeRange],
    queryFn: () => MultiBannerAnalyticsAPI.getAnalyticsSummary(storeId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch banner performance data
  const {
    data: bannerPerformance = [],
    isLoading: performanceLoading,
    error: performanceError,
    refetch: refetchPerformance
  } = useQuery({
    queryKey: ['banner-performance', storeId, timeRange],
    queryFn: () => MultiBannerAnalyticsAPI.getBannerPerformanceWithRanking(storeId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch time series data
  const {
    data: timeSeriesData = [],
    isLoading: timeSeriesLoading,
    error: timeSeriesError,
    refetch: refetchTimeSeries
  } = useQuery({
    queryKey: ['banner-time-series', storeId, timeRange],
    queryFn: () => MultiBannerAnalyticsAPI.getBannerTimeSeriesData(storeId, timeRange, 'day'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch comparison data
  const {
    data: comparisonData = [],
    isLoading: comparisonLoading,
    error: comparisonError,
    refetch: refetchComparison
  } = useQuery({
    queryKey: ['banner-comparison', storeId, timeRange],
    queryFn: () => MultiBannerAnalyticsAPI.getBannerComparisonData(storeId, undefined, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Computed states
  const isLoading = summaryLoading || performanceLoading || timeSeriesLoading || comparisonLoading;
  const hasErrors = !!(summaryError || performanceError || timeSeriesError || comparisonError);

  // Action handlers
  const refetchAll = () => {
    refetchSummary();
    refetchPerformance();
    refetchTimeSeries();
    refetchComparison();
  };

  // Export functionality
  const exportData = async (format: 'json' | 'csv' = 'json') => {
    try {
      setIsExporting(true);
      const data = await MultiBannerAnalyticsAPI.exportAnalyticsData(storeId, timeRange, format);
      
      // Create and trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `banner-analytics-${storeId}-${timeRange}days.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return data;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  // Utility functions
  const getTopPerformingBanners = (limit: number = 5): BannerPerformanceDetail[] => {
    return bannerPerformance
      .filter(banner => banner.ctr > 0)
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, limit);
  };

  const getPoorPerformingBanners = (limit: number = 5): BannerPerformanceDetail[] => {
    return bannerPerformance
      .filter(banner => banner.impressions > 0)
      .sort((a, b) => a.ctr - b.ctr)
      .slice(0, limit);
  };

  const getBannerById = (bannerId: string): BannerPerformanceDetail | undefined => {
    return bannerPerformance.find(banner => banner.bannerId === bannerId);
  };

  return {
    // Analytics data
    summary,
    bannerPerformance,
    timeSeriesData,
    comparisonData,
    
    // Loading states
    isLoading,
    summaryLoading,
    performanceLoading,
    timeSeriesLoading,
    comparisonLoading,
    
    // Error states
    summaryError,
    performanceError,
    timeSeriesError,
    comparisonError,
    hasErrors,
    
    // Time range management
    timeRange,
    setTimeRange,
    
    // Actions
    refetchSummary,
    refetchPerformance,
    refetchTimeSeries,
    refetchComparison,
    refetchAll,
    
    // Export functionality
    exportData,
    isExporting,
    
    // Utility functions
    getTopPerformingBanners,
    getPoorPerformingBanners,
    getBannerById
  };
};

// =========================
// Multi-Banner Comparison Hook
// =========================

interface UseMultiBannerComparisonOptions {
  storeId: string;
  bannerIds: string[];
  timeRange?: number;
}

interface UseMultiBannerComparisonReturn {
  comparisonData: BannerComparisonData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  
  // Comparison utilities
  getBestPerformer: () => BannerComparisonData | undefined;
  getWorstPerformer: () => BannerComparisonData | undefined;
  getAverageMetrics: () => {
    avgCTR: number;
    avgEngagementRate: number;
    avgConversionRate: number;
  };
}

/**
 * Hook for comparing specific banners
 */
export const useMultiBannerComparison = ({
  storeId,
  bannerIds,
  timeRange = 30
}: UseMultiBannerComparisonOptions): UseMultiBannerComparisonReturn => {
  const {
    data: comparisonData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['banner-comparison-specific', storeId, bannerIds, timeRange],
    queryFn: () => MultiBannerAnalyticsAPI.getBannerComparisonData(storeId, bannerIds, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: bannerIds.length > 0,
  });

  const getBestPerformer = (): BannerComparisonData | undefined => {
    return comparisonData.reduce((best, current) => 
      current.performanceScore > (best?.performanceScore || 0) ? current : best, 
      undefined as BannerComparisonData | undefined
    );
  };

  const getWorstPerformer = (): BannerComparisonData | undefined => {
    return comparisonData.reduce((worst, current) => 
      current.performanceScore < (worst?.performanceScore || Infinity) ? current : worst, 
      undefined as BannerComparisonData | undefined
    );
  };

  const getAverageMetrics = () => {
    if (comparisonData.length === 0) {
      return { avgCTR: 0, avgEngagementRate: 0, avgConversionRate: 0 };
    }

    const totals = comparisonData.reduce((acc, banner) => ({
      ctr: acc.ctr + banner.ctr,
      engagement: acc.engagement + banner.engagementRate,
      conversion: acc.conversion + banner.conversionRate
    }), { ctr: 0, engagement: 0, conversion: 0 });

    const count = comparisonData.length;
    return {
      avgCTR: totals.ctr / count,
      avgEngagementRate: totals.engagement / count,
      avgConversionRate: totals.conversion / count
    };
  };

  return {
    comparisonData,
    isLoading,
    error,
    refetch,
    getBestPerformer,
    getWorstPerformer,
    getAverageMetrics
  };
};

// Export both hooks (useMultiBannerComparison is already exported above)
