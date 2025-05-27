import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { BannersAPI, PromotionalBanner, CreateBannerData, UpdateBannerData } from '@/lib/api/store/banners';
import { toast } from 'sonner';
import {
  BannerFormData,
  BannerFormErrors,
  BannerFormHookReturn,
  initializeFormData,
  prepareCreateData,
  prepareUpdateData,
  isEditMode
} from '../utils';

/**
 * Custom hook for managing banner form state and operations
 * Extracted from BannerEntryModal.tsx for reusability
 */
export const useBannerForm = (
  storeId: string,
  editingBanner?: PromotionalBanner | null,
  onSuccess?: () => void
): BannerFormHookReturn => {
  const [formData, setFormData] = useState<BannerFormData>(initializeFormData(editingBanner));
  const [errors, setErrors] = useState<BannerFormErrors>({});

  // Reset form data when editingBanner changes
  useEffect(() => {
    setFormData(initializeFormData(editingBanner));
    setErrors({});
  }, [editingBanner]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBannerData) => BannersAPI.createBanner(data),
    onSuccess: () => {
      toast.success('Banner created successfully');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating banner:', error);
      toast.error('Failed to create banner');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ bannerId, data }: { bannerId: string; data: UpdateBannerData }) =>
      BannersAPI.updateBanner(bannerId, data),
    onSuccess: () => {
      toast.success('Banner updated successfully');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner');
    }
  });

  const updateFormData = (updates: Partial<BannerFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData(initializeFormData());
    setErrors({});
  };

  const handleSubmit = async (
    e: React.FormEvent,
    imageUrl: string | null,
    validateForm: () => boolean
  ) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditMode(editingBanner)) {
      // Update existing banner
      const updateData = prepareUpdateData(formData, imageUrl);
      updateMutation.mutate({
        bannerId: editingBanner!.id,
        data: updateData
      });
    } else {
      // Create new banner
      const createData = prepareCreateData(formData, imageUrl, storeId);
      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return {
    formData,
    errors,
    isLoading,
    updateFormData,
    validateForm: () => false, // Will be overridden by validation hook
    resetForm,
    handleSubmit,
    setErrors
  };
};
