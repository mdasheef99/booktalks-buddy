/**
 * Testimonial Mutations Hook
 * Custom hook for managing testimonial API mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CommunityShowcaseAPI } from '@/lib/api/store/communityShowcase';
import type { 
  TestimonialFormData, 
  TestimonialApprovalStatus 
} from '@/lib/api/store/types/communityShowcaseTypes';
import type { UseTestimonialMutationsResult } from '../types/testimonialTypes';
import { 
  TESTIMONIAL_QUERY_KEYS, 
  SUCCESS_MESSAGES, 
  ERROR_MESSAGES 
} from '../constants/testimonialConstants';

/**
 * Custom hook for testimonial mutations
 */
export const useTestimonialMutations = (
  storeId: string,
  onRefresh?: () => void
): UseTestimonialMutationsResult => {
  const queryClient = useQueryClient();

  // Helper function to invalidate queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ 
      queryKey: [TESTIMONIAL_QUERY_KEYS.COMMUNITY_SHOWCASE_ADMIN, storeId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [TESTIMONIAL_QUERY_KEYS.TESTIMONIALS_ADMIN, storeId] 
    });
    onRefresh?.();
  };

  // Create testimonial mutation
  const createMutation = useMutation({
    mutationFn: (data: TestimonialFormData) => 
      CommunityShowcaseAPI.createTestimonial(storeId, data),
    onSuccess: () => {
      invalidateQueries();
      toast.success(SUCCESS_MESSAGES.CREATED);
    },
    onError: (error) => {
      console.error('Error creating testimonial:', error);
      toast.error(ERROR_MESSAGES.CREATE_FAILED);
    },
  });

  // Update testimonial mutation
  const updateMutation = useMutation({
    mutationFn: ({ testimonialId, data }: { testimonialId: string; data: Partial<TestimonialFormData> }) =>
      CommunityShowcaseAPI.updateTestimonial(storeId, testimonialId, data),
    onSuccess: () => {
      invalidateQueries();
      toast.success(SUCCESS_MESSAGES.UPDATED);
    },
    onError: (error) => {
      console.error('Error updating testimonial:', error);
      toast.error(ERROR_MESSAGES.UPDATE_FAILED);
    },
  });

  // Delete testimonial mutation
  const deleteMutation = useMutation({
    mutationFn: (testimonialId: string) => 
      CommunityShowcaseAPI.deleteTestimonial(storeId, testimonialId),
    onSuccess: () => {
      invalidateQueries();
      toast.success(SUCCESS_MESSAGES.DELETED);
    },
    onError: (error) => {
      console.error('Error deleting testimonial:', error);
      toast.error(ERROR_MESSAGES.DELETE_FAILED);
    },
  });

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: ({ testimonialId, status }: { testimonialId: string; status: TestimonialApprovalStatus }) =>
      CommunityShowcaseAPI.updateTestimonialApproval(storeId, testimonialId, status),
    onSuccess: () => {
      invalidateQueries();
      toast.success(SUCCESS_MESSAGES.APPROVAL_UPDATED);
    },
    onError: (error) => {
      console.error('Error updating approval:', error);
      toast.error(ERROR_MESSAGES.APPROVAL_FAILED);
    },
  });

  // Combined loading state
  const isLoading = 
    createMutation.isPending || 
    updateMutation.isPending || 
    deleteMutation.isPending || 
    approvalMutation.isPending;

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    approvalMutation,
    isLoading,
  };
};

/**
 * Hook for individual mutation operations
 */
export const useTestimonialActions = (storeId: string, onRefresh?: () => void) => {
  const mutations = useTestimonialMutations(storeId, onRefresh);

  const createTestimonial = (data: TestimonialFormData) => {
    return mutations.createMutation.mutateAsync(data);
  };

  const updateTestimonial = (testimonialId: string, data: Partial<TestimonialFormData>) => {
    return mutations.updateMutation.mutateAsync({ testimonialId, data });
  };

  const deleteTestimonial = (testimonialId: string) => {
    return mutations.deleteMutation.mutateAsync(testimonialId);
  };

  const updateApproval = (testimonialId: string, status: TestimonialApprovalStatus) => {
    return mutations.approvalMutation.mutateAsync({ testimonialId, status });
  };

  return {
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    updateApproval,
    isLoading: mutations.isLoading,
    mutations,
  };
};
