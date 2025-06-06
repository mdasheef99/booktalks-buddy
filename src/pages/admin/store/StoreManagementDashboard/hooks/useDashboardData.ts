/**
 * Dashboard Data Hook
 * 
 * Handles data fetching for the Store Management Dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { useStoreOwnerContext } from '@/components/routeguards/StoreOwnerRouteGuard';
import { CarouselAPI } from '@/lib/api/store/carousel';
import { BannersAPI } from '@/lib/api/store/banners';
import { QuotesAPI } from '@/lib/api/store/quotes';
import { CommunityShowcaseAPI } from '@/lib/api/store/communityShowcase';
import { HeroCustomizationAPI } from '@/lib/api/store/heroCustomization';
import { AnalyticsAPI } from '@/lib/api/store/analytics/';
import type { DashboardData, LoadingStates } from '../types';

/**
 * Hook to fetch all dashboard data
 */
export function useDashboardData() {
  const { storeId } = useStoreOwnerContext();

  // Fetch carousel items
  const {
    data: carouselItems = [],
    isLoading: carouselLoading
  } = useQuery({
    queryKey: ['store-carousel-admin', storeId],
    queryFn: () => CarouselAPI.getCarouselItems(storeId),
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch banners
  const {
    data: banners = [],
    isLoading: bannersLoading
  } = useQuery({
    queryKey: ['store-banners-admin', storeId],
    queryFn: () => BannersAPI.getBanners(storeId),
    staleTime: 60 * 1000,
  });

  // Fetch quotes
  const {
    data: quotes = [],
    isLoading: quotesLoading
  } = useQuery({
    queryKey: ['store-quotes-admin', storeId],
    queryFn: () => QuotesAPI.getStoreQuotes(storeId),
    staleTime: 60 * 1000,
  });

  // Fetch community showcase data
  const {
    data: showcaseData,
    isLoading: showcaseLoading
  } = useQuery({
    queryKey: ['community-showcase-admin', storeId],
    queryFn: () => CommunityShowcaseAPI.getCommunityShowcaseData(storeId),
    staleTime: 60 * 1000,
  });

  // Fetch hero customization
  const {
    data: heroCustomization,
    isLoading: heroLoading
  } = useQuery({
    queryKey: ['hero-customization', storeId],
    queryFn: () => HeroCustomizationAPI.getHeroCustomizationWithDefaults(storeId),
    staleTime: 60 * 1000,
  });

  // Fetch analytics metrics
  const {
    data: analyticsMetrics,
    isLoading: analyticsLoading
  } = useQuery({
    queryKey: ['simple-analytics-metrics', storeId],
    queryFn: () => AnalyticsAPI.getSimpleMetrics(storeId),
    staleTime: 60 * 1000,
  });

  // Calculate overall loading state
  const isLoading = carouselLoading || bannersLoading || quotesLoading || 
                   showcaseLoading || heroLoading || analyticsLoading;

  // Prepare dashboard data
  const dashboardData: DashboardData = {
    carouselItems,
    banners,
    quotes,
    showcaseData,
    heroCustomization,
    analyticsMetrics: analyticsMetrics || {
      pageViews: 0,
      chatClicks: 0,
      bounceRate: 0,
      hasData: false
    }
  };

  // Prepare loading states
  const loadingStates: LoadingStates = {
    carouselLoading,
    bannersLoading,
    quotesLoading,
    showcaseLoading,
    heroLoading,
    analyticsLoading
  };

  return {
    data: dashboardData,
    loading: loadingStates,
    isLoading,
    storeId
  };
}

/**
 * Hook to fetch specific data with custom options
 */
export function useDashboardDataWithOptions(options: {
  enableCarousel?: boolean;
  enableBanners?: boolean;
  enableQuotes?: boolean;
  enableShowcase?: boolean;
  enableHero?: boolean;
  enableAnalytics?: boolean;
  staleTime?: number;
} = {}) {
  const { storeId } = useStoreOwnerContext();
  const {
    enableCarousel = true,
    enableBanners = true,
    enableQuotes = true,
    enableShowcase = true,
    enableHero = true,
    enableAnalytics = true,
    staleTime = 60 * 1000
  } = options;

  // Conditional queries based on options
  const carouselQuery = useQuery({
    queryKey: ['store-carousel-admin', storeId],
    queryFn: () => CarouselAPI.getCarouselItems(storeId),
    staleTime,
    enabled: enableCarousel
  });

  const bannersQuery = useQuery({
    queryKey: ['store-banners-admin', storeId],
    queryFn: () => BannersAPI.getBanners(storeId),
    staleTime,
    enabled: enableBanners
  });

  const quotesQuery = useQuery({
    queryKey: ['store-quotes-admin', storeId],
    queryFn: () => QuotesAPI.getStoreQuotes(storeId),
    staleTime,
    enabled: enableQuotes
  });

  const showcaseQuery = useQuery({
    queryKey: ['community-showcase-admin', storeId],
    queryFn: () => CommunityShowcaseAPI.getCommunityShowcaseData(storeId),
    staleTime,
    enabled: enableShowcase
  });

  const heroQuery = useQuery({
    queryKey: ['hero-customization', storeId],
    queryFn: () => HeroCustomizationAPI.getHeroCustomizationWithDefaults(storeId),
    staleTime,
    enabled: enableHero
  });

  const analyticsQuery = useQuery({
    queryKey: ['simple-analytics-metrics', storeId],
    queryFn: () => AnalyticsAPI.getSimpleMetrics(storeId),
    staleTime,
    enabled: enableAnalytics
  });

  // Calculate loading state
  const isLoading = (enableCarousel && carouselQuery.isLoading) ||
                   (enableBanners && bannersQuery.isLoading) ||
                   (enableQuotes && quotesQuery.isLoading) ||
                   (enableShowcase && showcaseQuery.isLoading) ||
                   (enableHero && heroQuery.isLoading) ||
                   (enableAnalytics && analyticsQuery.isLoading);

  return {
    carousel: carouselQuery,
    banners: bannersQuery,
    quotes: quotesQuery,
    showcase: showcaseQuery,
    hero: heroQuery,
    analytics: analyticsQuery,
    isLoading,
    storeId
  };
}

/**
 * Hook to refetch all dashboard data
 */
export function useRefreshDashboard() {
  const { storeId } = useStoreOwnerContext();

  const refreshAll = async () => {
    // This would trigger refetch of all queries
    // Implementation depends on your query client setup
    console.log('Refreshing dashboard data for store:', storeId);
  };

  return { refreshAll };
}
