/**
 * Testimonial Manager Hook
 * Main hook for managing testimonial manager state and actions
 */

import { useState, useCallback } from 'react';
import type { 
  Testimonial, 
  TestimonialFormData, 
  TestimonialApprovalStatus 
} from '@/lib/api/store/types/communityShowcaseTypes';
import type { UseTestimonialManagerResult } from '../types/testimonialTypes';
import { useTestimonialForm } from './useTestimonialForm';
import { useTestimonialMutations } from './useTestimonialMutations';
import { testimonialToFormData } from '../utils/testimonialUtils';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '../constants/testimonialConstants';

/**
 * Main hook for testimonial manager functionality
 */
export const useTestimonialManager = (
  storeId: string,
  onRefresh?: () => void
): UseTestimonialManagerResult => {
  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [deleteTestimonialId, setDeleteTestimonialId] = useState<string | null>(null);

  // Form management
  const formHook = useTestimonialForm();
  const mutations = useTestimonialMutations(storeId, onRefresh);

  /**
   * Handle creating a new testimonial
   */
  const handleCreateTestimonial = useCallback(() => {
    setEditingTestimonial(null);
    formHook.resetForm();
    setShowCreateDialog(true);
  }, [formHook]);

  /**
   * Handle editing an existing testimonial
   */
  const handleEditTestimonial = useCallback((testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    const formData = testimonialToFormData(testimonial);
    formHook.setFormData(formData);
    setShowCreateDialog(true);
  }, [formHook]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    // Validate form before submission
    if (!formHook.validateForm()) {
      const firstError = Object.values(formHook.errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    // Additional validation
    if (!formHook.formData.testimonial_text.trim()) {
      toast.error(ERROR_MESSAGES.TESTIMONIAL_TEXT_REQUIRED);
      return;
    }

    if (!formHook.formData.is_anonymous && !formHook.formData.customer_name?.trim()) {
      toast.error(ERROR_MESSAGES.CUSTOMER_NAME_REQUIRED);
      return;
    }

    try {
      const submitData = formHook.getSubmissionData();

      if (editingTestimonial) {
        await mutations.updateMutation.mutateAsync({ 
          testimonialId: editingTestimonial.id, 
          data: submitData 
        });
        setEditingTestimonial(null);
      } else {
        await mutations.createMutation.mutateAsync(submitData);
      }

      setShowCreateDialog(false);
      formHook.resetForm();
    } catch (error) {
      // Error handling is done in the mutations
      console.error('Submit error:', error);
    }
  }, [formHook, editingTestimonial, mutations]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTestimonialId) return;

    try {
      await mutations.deleteMutation.mutateAsync(deleteTestimonialId);
      setDeleteTestimonialId(null);
    } catch (error) {
      // Error handling is done in the mutations
      console.error('Delete error:', error);
    }
  }, [deleteTestimonialId, mutations]);

  /**
   * Handle approval status change
   */
  const handleApprovalChange = useCallback(async (
    testimonialId: string, 
    status: TestimonialApprovalStatus
  ) => {
    try {
      await mutations.approvalMutation.mutateAsync({ testimonialId, status });
    } catch (error) {
      // Error handling is done in the mutations
      console.error('Approval change error:', error);
    }
  }, [mutations]);

  /**
   * Update form data
   */
  const updateFormData = useCallback((data: TestimonialFormData) => {
    formHook.setFormData(data);
  }, [formHook]);

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    formHook.resetForm();
    setEditingTestimonial(null);
  }, [formHook]);

  /**
   * Close dialog and reset state
   */
  const closeDialog = useCallback(() => {
    setShowCreateDialog(false);
    setEditingTestimonial(null);
    formHook.resetForm();
  }, [formHook]);

  return {
    // Form state
    formState: {
      formData: formHook.formData,
      isEditing: Boolean(editingTestimonial),
      editingTestimonial,
      showDialog: showCreateDialog,
      errors: formHook.errors,
    },
    updateFormData,
    resetForm,

    // Dialog state
    showCreateDialog,
    setShowCreateDialog: (show: boolean) => {
      if (!show) {
        closeDialog();
      } else {
        setShowCreateDialog(show);
      }
    },

    // Delete state
    deleteTestimonialId,
    setDeleteTestimonialId,

    // Actions
    handleCreateTestimonial,
    handleEditTestimonial,
    handleSubmit,
    handleDeleteConfirm,
    handleApprovalChange,

    // Mutations
    mutations,

    // Form utilities
    formHook,
  };
};

/**
 * Hook for managing dialog state
 */
export const useTestimonialDialogs = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTestimonialId, setDeleteTestimonialId] = useState<string | null>(null);

  const openCreateDialog = () => setShowCreateDialog(true);
  const closeCreateDialog = () => setShowCreateDialog(false);
  const openDeleteDialog = (id: string) => setDeleteTestimonialId(id);
  const closeDeleteDialog = () => setDeleteTestimonialId(null);

  return {
    showCreateDialog,
    deleteTestimonialId,
    openCreateDialog,
    closeCreateDialog,
    openDeleteDialog,
    closeDeleteDialog,
    setShowCreateDialog,
    setDeleteTestimonialId,
  };
};
