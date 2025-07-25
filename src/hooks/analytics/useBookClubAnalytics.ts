import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookClubAnalyticsAPI } from '@/lib/api/store/bookClubAnalytics';

interface UseBookClubAnalyticsOptions {
  storeId: string;
  initialTimeRange?: number;
}

interface UseBookClubAnalyticsReturn {
  // State
  timeRange: number;
  setTimeRange: (range: number) => void;
  
  // Analytics data
  analyticsData: any;
  insights: any;
  
  // Loading states
  isLoading: boolean;
  analyticsLoading: boolean;
  insightsLoading: boolean;
  
  // Error states
  analyticsError: Error | null;
  insightsError: Error | null;
  
  // Actions
  refetchAnalytics: () => void;
  refetchInsights: () => void;
  refetchAll: () => void;
}

/**
 * Custom hook for Book Club Analytics data management
 * Handles data fetching, state management, and provides convenient actions
 */
export const useBookClubAnalytics = ({
  storeId,
  initialTimeRange = 30
}: UseBookClubAnalyticsOptions): UseBookClubAnalyticsReturn => {
  const [timeRange, setTimeRange] = useState<number>(initialTimeRange);

  // Fetch comprehensive analytics data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ['book-club-analytics', storeId, timeRange],
    queryFn: () => BookClubAnalyticsAPI.getComprehensiveAnalytics(storeId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch insights and recommendations
  const {
    data: insights,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights
  } = useQuery({
    queryKey: ['book-club-insights', storeId],
    queryFn: () => BookClubAnalyticsAPI.getAnalyticsInsights(storeId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const isLoading = analyticsLoading || insightsLoading;

  const refetchAll = () => {
    refetchAnalytics();
    refetchInsights();
  };

  return {
    // State
    timeRange,
    setTimeRange,
    
    // Data
    analyticsData,
    insights,
    
    // Loading states
    isLoading,
    analyticsLoading,
    insightsLoading,
    
    // Error states
    analyticsError,
    insightsError,
    
    // Actions
    refetchAnalytics,
    refetchInsights,
    refetchAll
  };
};
