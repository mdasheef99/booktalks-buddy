import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CarouselAPI, CarouselItem, CreateCarouselItemData, UpdateCarouselItemData } from '@/lib/api/store/carousel';
import { toast } from 'sonner';
import {
  BookFormData,
  BookFormErrors,
  BookFormHookReturn
} from '../types/bookFormTypes';
import {
  initializeFormData,
  prepareCreateData,
  prepareUpdateData,
  isEditMode
} from '../utils';

/**
 * Custom hook for managing book form state and operations
 * Extracted from BookEntryModal.tsx for reusability
 */
export const useBookForm = (
  storeId: string,
  editingItem?: CarouselItem | null,
  onSuccess?: () => void
): BookFormHookReturn => {
  const [formData, setFormData] = useState<BookFormData>(initializeFormData(editingItem));
  const [errors, setErrors] = useState<BookFormErrors>({});

  // Reset form data when editingItem changes
  useEffect(() => {
    setFormData(initializeFormData(editingItem));
    setErrors({});
  }, [editingItem]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCarouselItemData) => CarouselAPI.createCarouselItem(data),
    onSuccess: () => {
      toast.success('Book added to carousel');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating carousel item:', error);
      toast.error('Failed to add book to carousel');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateCarouselItemData }) =>
      CarouselAPI.updateCarouselItem(itemId, data),
    onSuccess: () => {
      toast.success('Book updated successfully');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error updating carousel item:', error);
      toast.error('Failed to update book');
    }
  });

  const updateFormData = (updates: Partial<BookFormData>) => {
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

    if (isEditMode(editingItem)) {
      // Update existing item
      const updateData = prepareUpdateData(formData, imageUrl);
      updateMutation.mutate({
        itemId: editingItem.id,
        data: updateData
      });
    } else {
      // Create new item
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
