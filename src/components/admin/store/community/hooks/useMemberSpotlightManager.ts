/**
 * Member Spotlight Manager Hook
 * Main hook for managing member spotlight manager state and actions
 */

import { useState, useCallback } from 'react';
import type { 
  MemberSpotlight, 
  MemberSpotlightFormData 
} from '@/lib/api/store/types/communityShowcaseTypes';
import type { UseMemberSpotlightManagerResult } from '../types/memberSpotlightTypes';
import { useMemberSpotlightForm } from './useMemberSpotlightForm';
import { useMemberSpotlightMutations } from './useMemberSpotlightMutations';
import { useMemberSearch } from './useMemberSearch';
import { spotlightToFormData } from '../utils/memberSpotlightUtils';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '../constants/memberSpotlightConstants';

/**
 * Main hook for member spotlight manager functionality
 */
export const useMemberSpotlightManager = (
  storeId: string,
  onRefresh?: () => void
): UseMemberSpotlightManagerResult => {
  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSpotlight, setEditingSpotlight] = useState<MemberSpotlight | null>(null);
  const [deleteSpotlightId, setDeleteSpotlightId] = useState<string | null>(null);

  // Form management
  const formHook = useMemberSpotlightForm();
  const mutations = useMemberSpotlightMutations(storeId, onRefresh);
  const searchHook = useMemberSearch(storeId);

  /**
   * Handle creating a new spotlight
   */
  const handleCreateSpotlight = useCallback(() => {
    setEditingSpotlight(null);
    formHook.resetForm();
    searchHook.clearSearch();
    setShowCreateDialog(true);
  }, [formHook, searchHook]);

  /**
   * Handle editing an existing spotlight
   */
  const handleEditSpotlight = useCallback((spotlight: MemberSpotlight) => {
    setEditingSpotlight(spotlight);
    const formData = spotlightToFormData(spotlight);
    formHook.setFormData(formData);
    searchHook.clearSearch();
    setShowCreateDialog(true);
  }, [formHook, searchHook]);

  /**
   * Handle member selection
   */
  const handleMemberSelect = useCallback((memberId: string) => {
    formHook.updateField('featured_member_id', memberId);
    searchHook.clearSearch();
  }, [formHook, searchHook]);

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
    if (!formHook.formData.featured_member_id.trim()) {
      toast.error(ERROR_MESSAGES.MEMBER_REQUIRED);
      return;
    }

    if (!formHook.formData.spotlight_description.trim()) {
      toast.error(ERROR_MESSAGES.DESCRIPTION_REQUIRED);
      return;
    }

    try {
      const submitData = formHook.getSubmissionData();

      if (editingSpotlight) {
        await mutations.updateMutation.mutateAsync({ 
          spotlightId: editingSpotlight.id, 
          data: submitData 
        });
        setEditingSpotlight(null);
      } else {
        await mutations.createMutation.mutateAsync(submitData);
      }

      setShowCreateDialog(false);
      formHook.resetForm();
      searchHook.clearSearch();
    } catch (error) {
      // Error handling is done in the mutations
      console.error('Submit error:', error);
    }
  }, [formHook, editingSpotlight, mutations, searchHook]);

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteSpotlightId) return;

    try {
      await mutations.deleteMutation.mutateAsync(deleteSpotlightId);
      setDeleteSpotlightId(null);
    } catch (error) {
      // Error handling is done in the mutations
      console.error('Delete error:', error);
    }
  }, [deleteSpotlightId, mutations]);

  /**
   * Update form data
   */
  const updateFormData = useCallback((data: MemberSpotlightFormData) => {
    formHook.setFormData(data);
  }, [formHook]);

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    formHook.resetForm();
    setEditingSpotlight(null);
    searchHook.clearSearch();
  }, [formHook, searchHook]);

  /**
   * Update search term
   */
  const updateSearchTerm = useCallback((term: string) => {
    searchHook.setSearchTerm(term);
  }, [searchHook]);

  /**
   * Close dialog and reset state
   */
  const closeDialog = useCallback(() => {
    setShowCreateDialog(false);
    setEditingSpotlight(null);
    formHook.resetForm();
    searchHook.clearSearch();
  }, [formHook, searchHook]);

  return {
    // Form state
    formState: {
      formData: formHook.formData,
      isEditing: Boolean(editingSpotlight),
      editingSpotlight,
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
    deleteSpotlightId,
    setDeleteSpotlightId,

    // Search state
    searchState: {
      searchTerm: searchHook.searchTerm,
      members: searchHook.members,
      isLoading: searchHook.isLoading,
      error: searchHook.error,
    },
    updateSearchTerm,

    // Actions
    handleCreateSpotlight,
    handleEditSpotlight,
    handleSubmit,
    handleDeleteConfirm,
    handleMemberSelect,

    // Mutations
    mutations,

    // Individual hooks for advanced usage
    formHook,
    searchHook,
  };
};

/**
 * Hook for managing dialog state
 */
export const useMemberSpotlightDialogs = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteSpotlightId, setDeleteSpotlightId] = useState<string | null>(null);

  const openCreateDialog = () => setShowCreateDialog(true);
  const closeCreateDialog = () => setShowCreateDialog(false);
  const openDeleteDialog = (id: string) => setDeleteSpotlightId(id);
  const closeDeleteDialog = () => setDeleteSpotlightId(null);

  return {
    showCreateDialog,
    deleteSpotlightId,
    openCreateDialog,
    closeCreateDialog,
    openDeleteDialog,
    closeDeleteDialog,
    setShowCreateDialog,
    setDeleteSpotlightId,
  };
};
