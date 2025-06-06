import { useCallback } from 'react';
import { PromotionalBanner } from '@/lib/api/store/banners';
import {
  BannerFormData,
  BannerFormErrors,
  validateBannerForm,
  hasValidationErrors,
  validateField,
  isFormValid
} from '../utils';

/**
 * Custom hook for banner form validation
 * Extracted from BannerEntryModal.tsx for reusability
 */
export const useBannerValidation = (
  formData: BannerFormData,
  imageUrl: string | null,
  editingBanner?: PromotionalBanner | null,
  setErrors?: (errors: BannerFormErrors) => void
) => {
  const validateForm = useCallback((): boolean => {
    const newErrors = validateBannerForm(formData, imageUrl, editingBanner);
    setErrors?.(newErrors);
    return !hasValidationErrors(newErrors);
  }, [formData, imageUrl, editingBanner, setErrors]);

  const validateSingleField = useCallback((
    fieldName: keyof BannerFormData,
    value: string
  ): string | undefined => {
    return validateField(fieldName, value, formData, imageUrl);
  }, [formData, imageUrl]);

  const isValid = useCallback((): boolean => {
    return isFormValid(formData, imageUrl, editingBanner);
  }, [formData, imageUrl, editingBanner]);

  const getValidationErrors = useCallback((): BannerFormErrors => {
    return validateBannerForm(formData, imageUrl, editingBanner);
  }, [formData, imageUrl, editingBanner]);

  return {
    validateForm,
    validateSingleField,
    isValid,
    getValidationErrors
  };
};
