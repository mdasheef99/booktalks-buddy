/**
 * Member Spotlight Form Hook
 * Custom hook for managing member spotlight form state and validation
 */

import { useState, useCallback } from 'react';
import type { MemberSpotlightFormData } from '@/lib/api/store/types/communityShowcaseTypes';
import type { 
  MemberSpotlightFormErrors, 
  UseMemberSpotlightFormResult 
} from '../types/memberSpotlightTypes';
import { 
  validateMemberSpotlightForm, 
  hasValidationErrors, 
  validateField, 
  updateFieldError,
  prepareSubmissionData
} from '../utils/memberSpotlightValidation';
import { createDefaultFormData } from '../utils/memberSpotlightUtils';

/**
 * Custom hook for managing member spotlight form state
 */
export const useMemberSpotlightForm = (initialData?: MemberSpotlightFormData): UseMemberSpotlightFormResult => {
  const [formData, setFormData] = useState<MemberSpotlightFormData>(
    initialData || createDefaultFormData()
  );
  const [errors, setErrors] = useState<MemberSpotlightFormErrors>({});

  /**
   * Update a specific form field
   */
  const updateField = useCallback(<K extends keyof MemberSpotlightFormData>(
    field: K, 
    value: MemberSpotlightFormData[K]
  ) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Real-time validation for the changed field
      const fieldError = validateField(field, value, newData);
      setErrors(prevErrors => updateFieldError(prevErrors, field, fieldError));
      
      return newData;
    });
  }, []);

  /**
   * Reset form to default values
   */
  const resetForm = useCallback(() => {
    setFormData(createDefaultFormData());
    setErrors({});
  }, []);

  /**
   * Set entire form data (for editing)
   */
  const setFormDataCallback = useCallback((data: MemberSpotlightFormData) => {
    setFormData(data);
    setErrors({});
  }, []);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    const validationErrors = validateMemberSpotlightForm(formData);
    setErrors(validationErrors);
    return !hasValidationErrors(validationErrors);
  }, [formData]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Check if form is currently valid
   */
  const isValid = !hasValidationErrors(errors) && 
    formData.featured_member_id.trim().length > 0 && 
    formData.spotlight_description.trim().length > 0;

  /**
   * Get prepared data for submission
   */
  const getSubmissionData = useCallback((): MemberSpotlightFormData => {
    return prepareSubmissionData(formData);
  }, [formData]);

  return {
    formData,
    errors,
    isValid,
    updateField,
    resetForm,
    setFormData: setFormDataCallback,
    validateForm,
    clearErrors,
    getSubmissionData,
  };
};

/**
 * Hook for managing form field changes with validation
 */
export const useFormFieldValidation = () => {
  const [fieldErrors, setFieldErrors] = useState<MemberSpotlightFormErrors>({});

  const validateFieldChange = useCallback(<K extends keyof MemberSpotlightFormData>(
    field: K,
    value: MemberSpotlightFormData[K],
    formData: MemberSpotlightFormData
  ) => {
    const error = validateField(field, value, formData);
    setFieldErrors(prev => updateFieldError(prev, field, error));
    return error;
  }, []);

  const clearFieldError = useCallback((field: keyof MemberSpotlightFormData) => {
    setFieldErrors(prev => updateFieldError(prev, field, undefined));
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  return {
    fieldErrors,
    validateFieldChange,
    clearFieldError,
    clearAllErrors,
  };
};
