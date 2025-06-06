/**
 * Member Spotlight Mutations Hook
 * Custom hook for managing member spotlight API mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CommunityShowcaseAPI } from '@/lib/api/store/communityShowcase';
import type { MemberSpotlightFormData } from '@/lib/api/store/types/communityShowcaseTypes';
import type { UseMemberSpotlightMutationsResult } from '../types/memberSpotlightTypes';
import { 
  SPOTLIGHT_QUERY_KEYS, 
  SUCCESS_MESSAGES, 
  ERROR_MESSAGES 
} from '../constants/memberSpotlightConstants';

/**
 * Custom hook for member spotlight mutations
 */
export const useMemberSpotlightMutations = (
  storeId: string,
  onRefresh?: () => void
): UseMemberSpotlightMutationsResult => {
  const queryClient = useQueryClient();

  // Helper function to invalidate queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ 
      queryKey: [SPOTLIGHT_QUERY_KEYS.COMMUNITY_SHOWCASE_ADMIN, storeId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [SPOTLIGHT_QUERY_KEYS.MEMBER_SPOTLIGHTS_ADMIN, storeId] 
    });
    onRefresh?.();
  };

  // Create spotlight mutation
  const createMutation = useMutation({
    mutationFn: (data: MemberSpotlightFormData) => 
      CommunityShowcaseAPI.createMemberSpotlight(storeId, data),
    onSuccess: () => {
      invalidateQueries();
      toast.success(SUCCESS_MESSAGES.CREATED);
    },
    onError: (error) => {
      console.error('Error creating spotlight:', error);
      toast.error(ERROR_MESSAGES.CREATE_FAILED);
    },
  });

  // Update spotlight mutation
  const updateMutation = useMutation({
    mutationFn: ({ spotlightId, data }: { spotlightId: string; data: Partial<MemberSpotlightFormData> }) =>
      CommunityShowcaseAPI.updateMemberSpotlight(storeId, spotlightId, data),
    onSuccess: () => {
      invalidateQueries();
      toast.success(SUCCESS_MESSAGES.UPDATED);
    },
    onError: (error) => {
      console.error('Error updating spotlight:', error);
      toast.error(ERROR_MESSAGES.UPDATE_FAILED);
    },
  });

  // Delete spotlight mutation
  const deleteMutation = useMutation({
    mutationFn: (spotlightId: string) => 
      CommunityShowcaseAPI.deleteMemberSpotlight(storeId, spotlightId),
    onSuccess: () => {
      invalidateQueries();
      toast.success(SUCCESS_MESSAGES.DELETED);
    },
    onError: (error) => {
      console.error('Error deleting spotlight:', error);
      toast.error(ERROR_MESSAGES.DELETE_FAILED);
    },
  });

  // Combined loading state
  const isLoading = 
    createMutation.isPending || 
    updateMutation.isPending || 
    deleteMutation.isPending;

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    isLoading,
  };
};

/**
 * Hook for individual mutation operations
 */
export const useMemberSpotlightActions = (storeId: string, onRefresh?: () => void) => {
  const mutations = useMemberSpotlightMutations(storeId, onRefresh);

  const createSpotlight = (data: MemberSpotlightFormData) => {
    return mutations.createMutation.mutateAsync(data);
  };

  const updateSpotlight = (spotlightId: string, data: Partial<MemberSpotlightFormData>) => {
    return mutations.updateMutation.mutateAsync({ spotlightId, data });
  };

  const deleteSpotlight = (spotlightId: string) => {
    return mutations.deleteMutation.mutateAsync(spotlightId);
  };

  return {
    createSpotlight,
    updateSpotlight,
    deleteSpotlight,
    isLoading: mutations.isLoading,
    mutations,
  };
};
