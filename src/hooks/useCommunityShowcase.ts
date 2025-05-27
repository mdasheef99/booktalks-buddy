import { useQuery } from '@tanstack/react-query';
import { CommunityShowcaseAPI, CommunityShowcaseData } from '@/lib/api/store/communityShowcase';

interface UseCommunityShowcaseResult {
  showcaseData: CommunityShowcaseData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching community showcase data for landing page display
 */
export const useCommunityShowcase = (storeId?: string): UseCommunityShowcaseResult => {
  const {
    data: showcaseData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['community-showcase', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      return await CommunityShowcaseAPI.getCommunityShowcaseData(storeId);
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    showcaseData: showcaseData || null,
    loading: isLoading,
    error: error ? 'Failed to load community showcase data' : null,
    refetch,
  };
};

/**
 * Hook for admin management of member spotlights
 */
export const useMemberSpotlights = (storeId: string) => {
  const {
    data: spotlights = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['member-spotlights-admin', storeId],
    queryFn: () => CommunityShowcaseAPI.getActiveSpotlights(storeId),
    enabled: !!storeId,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    spotlights,
    loading: isLoading,
    error: error ? 'Failed to load member spotlights' : null,
    refetch,
  };
};

/**
 * Hook for admin management of testimonials
 */
export const useTestimonials = (storeId: string) => {
  const {
    data: testimonials = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['testimonials-admin', storeId],
    queryFn: () => CommunityShowcaseAPI.getAllTestimonials(storeId),
    enabled: !!storeId,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    testimonials,
    loading: isLoading,
    error: error ? 'Failed to load testimonials' : null,
    refetch,
  };
};

/**
 * Hook for community metrics
 */
export const useCommunityMetrics = (storeId: string) => {
  const {
    data: metrics,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['community-metrics', storeId],
    queryFn: () => CommunityShowcaseAPI.getCommunityMetrics(storeId),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    metrics: metrics || {
      active_members: 0,
      total_clubs: 0,
      recent_discussions: 0,
      books_discussed_this_month: 0,
      new_members_this_month: 0,
    },
    loading: isLoading,
    error: error ? 'Failed to load community metrics' : null,
    refetch,
  };
};

/**
 * Hook for recent activity feed
 */
export const useActivityFeed = (storeId: string, limit: number = 5) => {
  const {
    data: activities = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['activity-feed', storeId, limit],
    queryFn: () => CommunityShowcaseAPI.getRecentActivity(storeId, limit),
    enabled: !!storeId,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
  });

  return {
    activities,
    loading: isLoading,
    error: error ? 'Failed to load activity feed' : null,
    refetch,
  };
};

/**
 * Hook for searching store members
 */
export const useStoreMembers = (storeId: string, searchTerm: string = '') => {
  const {
    data: members = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['store-members', storeId, searchTerm],
    queryFn: () => CommunityShowcaseAPI.searchStoreMembers(storeId, searchTerm),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    members,
    loading: isLoading,
    error: error ? 'Failed to search members' : null,
    refetch,
  };
};

/**
 * Hook for showcase settings
 */
export const useShowcaseSettings = (storeId: string) => {
  const {
    data: settings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['showcase-settings', storeId],
    queryFn: () => CommunityShowcaseAPI.getShowcaseSettings(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    settings: settings || {
      show_member_spotlights: false,
      show_testimonials: false,
      show_activity_feed: false,
      show_community_metrics: false,
      max_spotlights_display: 3,
      activity_feed_limit: 5,
    },
    loading: isLoading,
    error: error ? 'Failed to load showcase settings' : null,
    refetch,
  };
};
