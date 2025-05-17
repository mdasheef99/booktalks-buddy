import { useState, useEffect, useCallback } from 'react';
import { TimeRange, AnalyticsData, UserGrowthData, ActivityData, UserStats } from '@/lib/analytics/types';
import { fetchAnalyticsData } from '@/lib/analytics/service';

// Default empty state for analytics data
const defaultAnalyticsData: AnalyticsData = {
  userGrowthData: [],
  activityData: [],
  userStats: {
    totalUsers: 0,
    activeUsers: 0,
    usersByTier: {
      free: 0,
      privileged: 0,
      privileged_plus: 0
    }
  }
};

/**
 * Custom hook for fetching and managing analytics data
 * @param initialTimeRange Initial time range to fetch data for
 * @returns Analytics data, loading state, error state, and functions to update the time range
 */
export const useAnalyticsData = (initialTimeRange: TimeRange = '12months') => {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(defaultAnalyticsData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchAnalyticsData(timeRange);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error in useAnalyticsData:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics data'));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Fetch data when the time range changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update time range
  const updateTimeRange = useCallback((newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
  }, []);

  // Refresh data manually
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    timeRange,
    updateTimeRange,
    refreshData,
    loading,
    error,
    ...analyticsData
  };
};
