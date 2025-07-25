import { useQuery } from '@tanstack/react-query';
import { AnalyticsAPI } from '@/lib/api/store/analytics/';

interface UseLandingPageAnalyticsOptions {
  storeId: string;
}

interface UseLandingPageAnalyticsReturn {
  // Analytics data
  enhancedAnalytics: any;
  performanceAlerts: any[];
  recommendations: any[];
  
  // Loading states
  isLoading: boolean;
  analyticsLoading: boolean;
  alertsLoading: boolean;
  recommendationsLoading: boolean;
  
  // Error states
  analyticsError: Error | null;
  alertsError: Error | null;
  recommendationsError: Error | null;
  
  // Actions
  refetchAnalytics: () => void;
  refetchAlerts: () => void;
  refetchRecommendations: () => void;
  refetchAll: () => void;
}

/**
 * Custom hook for Landing Page Analytics data management
 * Handles data fetching, state management, and provides convenient actions
 */
export const useLandingPageAnalytics = ({
  storeId
}: UseLandingPageAnalyticsOptions): UseLandingPageAnalyticsReturn => {
  // Fetch enhanced analytics
  const {
    data: enhancedAnalytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ['enhanced-analytics', storeId],
    queryFn: () => AnalyticsAPI.getEnhancedAnalytics(storeId, 30),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch performance alerts
  const {
    data: performanceAlerts = [],
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts
  } = useQuery({
    queryKey: ['performance-alerts', storeId],
    queryFn: () => AnalyticsAPI.getPerformanceAlerts(storeId),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch basic recommendations
  const {
    data: recommendations = [],
    isLoading: recommendationsLoading,
    error: recommendationsError,
    refetch: refetchRecommendations
  } = useQuery({
    queryKey: ['basic-recommendations', storeId],
    queryFn: () => AnalyticsAPI.getBasicRecommendations(storeId),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = analyticsLoading || alertsLoading || recommendationsLoading;

  const refetchAll = () => {
    refetchAnalytics();
    refetchAlerts();
    refetchRecommendations();
  };

  return {
    // Data
    enhancedAnalytics,
    performanceAlerts,
    recommendations,
    
    // Loading states
    isLoading,
    analyticsLoading,
    alertsLoading,
    recommendationsLoading,
    
    // Error states
    analyticsError,
    alertsError,
    recommendationsError,
    
    // Actions
    refetchAnalytics,
    refetchAlerts,
    refetchRecommendations,
    refetchAll
  };
};
