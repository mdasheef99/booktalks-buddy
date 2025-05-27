/**
 * Custom Hooks for Community Showcase Data Management
 * Centralized hooks for API state management and data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  CommunityShowcaseData,
  MemberSpotlight,
  Testimonial,
  CommunityMetrics,
  ActivityFeedItem,
  ShowcaseSettings,
  StoreUser,
  MemberSpotlightFormData,
  TestimonialFormData,
  TestimonialApprovalStatus,
  ShowcaseSettingsUpdate
} from '../types/communityShowcaseTypes';

// We'll import the actual API methods after we split them
import { CommunityShowcaseAPI } from '../communityShowcase';

// ===== QUERY KEYS =====

export const QUERY_KEYS = {
  showcaseData: (storeId: string) => ['community-showcase', storeId],
  spotlights: (storeId: string) => ['member-spotlights', storeId],
  testimonials: (storeId: string) => ['testimonials', storeId],
  allTestimonials: (storeId: string) => ['all-testimonials', storeId],
  metrics: (storeId: string) => ['community-metrics', storeId],
  activity: (storeId: string) => ['activity-feed', storeId],
  settings: (storeId: string) => ['showcase-settings', storeId],
  storeMembers: (storeId: string, searchTerm?: string) => ['store-members', storeId, searchTerm],
} as const;

// ===== DATA FETCHING HOOKS =====

/**
 * Hook for fetching complete community showcase data
 */
export const useCommunityShowcaseData = (storeId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.showcaseData(storeId),
    queryFn: () => CommunityShowcaseAPI.getCommunityShowcaseData(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching member spotlights
 */
export const useMemberSpotlights = (storeId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.spotlights(storeId),
    queryFn: () => CommunityShowcaseAPI.getActiveSpotlights(storeId),
    enabled: !!storeId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

/**
 * Hook for fetching approved testimonials
 */
export const useApprovedTestimonials = (storeId: string, limit?: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.testimonials(storeId),
    queryFn: () => CommunityShowcaseAPI.getApprovedTestimonials(storeId, limit),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching all testimonials (admin)
 */
export const useAllTestimonials = (storeId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.allTestimonials(storeId),
    queryFn: () => CommunityShowcaseAPI.getAllTestimonials(storeId),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for fetching community metrics
 */
export const useCommunityMetrics = (storeId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.metrics(storeId),
    queryFn: () => CommunityShowcaseAPI.getCommunityMetrics(storeId),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching recent activity
 */
export const useRecentActivity = (storeId: string, limit?: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.activity(storeId),
    queryFn: () => CommunityShowcaseAPI.getRecentActivity(storeId, limit),
    enabled: !!storeId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook for fetching showcase settings
 */
export const useShowcaseSettings = (storeId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.settings(storeId),
    queryFn: () => CommunityShowcaseAPI.getShowcaseSettings(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for searching store members
 */
export const useStoreMembers = (storeId: string, searchTerm: string = '') => {
  return useQuery({
    queryKey: QUERY_KEYS.storeMembers(storeId, searchTerm),
    queryFn: () => CommunityShowcaseAPI.searchStoreMembers(storeId, searchTerm),
    enabled: !!storeId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// ===== MUTATION HOOKS =====

/**
 * Hook for creating member spotlight
 */
export const useCreateMemberSpotlight = (storeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MemberSpotlightFormData) => 
      CommunityShowcaseAPI.createMemberSpotlight(storeId, data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.showcaseData(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.spotlights(storeId) });
    },
  });
};

/**
 * Hook for updating member spotlight
 */
export const useUpdateMemberSpotlight = (storeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ spotlightId, updates }: { spotlightId: string; updates: Partial<MemberSpotlightFormData> }) =>
      CommunityShowcaseAPI.updateMemberSpotlight(storeId, spotlightId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.showcaseData(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.spotlights(storeId) });
    },
  });
};

/**
 * Hook for deleting member spotlight
 */
export const useDeleteMemberSpotlight = (storeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (spotlightId: string) =>
      CommunityShowcaseAPI.deleteMemberSpotlight(storeId, spotlightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.showcaseData(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.spotlights(storeId) });
    },
  });
};

/**
 * Hook for creating testimonial
 */
export const useCreateTestimonial = (storeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TestimonialFormData) =>
      CommunityShowcaseAPI.createTestimonial(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.showcaseData(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.testimonials(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allTestimonials(storeId) });
    },
  });
};

/**
 * Hook for updating testimonial
 */
export const useUpdateTestimonial = (storeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ testimonialId, updates }: { testimonialId: string; updates: Partial<TestimonialFormData> }) =>
      CommunityShowcaseAPI.updateTestimonial(storeId, testimonialId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.showcaseData(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.testimonials(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allTestimonials(storeId) });
    },
  });
};

/**
 * Hook for deleting testimonial
 */
export const useDeleteTestimonial = (storeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (testimonialId: string) =>
      CommunityShowcaseAPI.deleteTestimonial(storeId, testimonialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.showcaseData(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.testimonials(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allTestimonials(storeId) });
    },
  });
};

/**
 * Hook for updating testimonial approval
 */
export const useUpdateTestimonialApproval = (storeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ testimonialId, status }: { testimonialId: string; status: TestimonialApprovalStatus }) =>
      CommunityShowcaseAPI.updateTestimonialApproval(storeId, testimonialId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.showcaseData(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.testimonials(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allTestimonials(storeId) });
    },
  });
};

/**
 * Hook for reordering testimonials
 */
export const useReorderTestimonials = (storeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (testimonialIds: string[]) =>
      CommunityShowcaseAPI.reorderTestimonials(storeId, testimonialIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.showcaseData(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.testimonials(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allTestimonials(storeId) });
    },
  });
};

/**
 * Hook for updating showcase settings
 */
export const useUpdateShowcaseSettings = (storeId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<ShowcaseSettingsUpdate>) =>
      CommunityShowcaseAPI.updateShowcaseSettings(storeId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.showcaseData(storeId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings(storeId) });
    },
  });
};
