import { useState, useCallback } from 'react';
import { CarouselItem } from '@/lib/api/store/carousel';
import {
  BookFormData,
  BookFormErrors,
  BookValidationHookReturn
} from '../types/bookFormTypes';
import {
  validateForm as validateFormUtil,
  hasValidationErrors
} from '../utils';

/**
 * Custom hook for managing book form validation
 * Extracted from BookEntryModal.tsx for reusability
 */
export const useBookValidation = (): BookValidationHookReturn => {
  const [errors, setErrors] = useState<BookFormErrors>({});

  const validateForm = useCallback((
    formData: BookFormData,
    imageUrl: string | null,
    editingItem?: CarouselItem | null
  ): boolean => {
    const newErrors = validateFormUtil(formData, editingItem);
    setErrors(newErrors);
    return !hasValidationErrors(newErrors);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateForm,
    setErrors,
    clearErrors
  };
};
