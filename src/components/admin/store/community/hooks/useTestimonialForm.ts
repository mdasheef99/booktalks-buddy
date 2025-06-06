/**
 * Testimonial Form Hook
 * Custom hook for managing testimonial form state and validation
 */

import { useState, useCallback } from 'react';
import type { TestimonialFormData } from '@/lib/api/store/types/communityShowcaseTypes';
import type { 
  TestimonialFormErrors, 
  UseTestimonialFormResult 
} from '../types/testimonialTypes';
import { 
  validateTestimonialForm, 
  hasValidationErrors, 
  validateField, 
  updateFieldError,
  prepareSubmissionData
} from '../utils/testimonialValidation';
import { createDefaultFormData } from '../utils/testimonialUtils';

/**
 * Custom hook for managing testimonial form state
 */
export const useTestimonialForm = (initialData?: TestimonialFormData): UseTestimonialFormResult => {
  const [formData, setFormData] = useState<TestimonialFormData>(
    initialData || createDefaultFormData()
  );
  const [errors, setErrors] = useState<TestimonialFormErrors>({});

  /**
   * Update a specific form field
   */
  const updateField = useCallback(<K extends keyof TestimonialFormData>(
    field: K, 
    value: TestimonialFormData[K]
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
  const setFormDataCallback = useCallback((data: TestimonialFormData) => {
    setFormData(data);
    setErrors({});
  }, []);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    const validationErrors = validateTestimonialForm(formData);
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
  const isValid = !hasValidationErrors(errors) && formData.testimonial_text.trim().length > 0;

  /**
   * Get prepared data for submission
   */
  const getSubmissionData = useCallback((): TestimonialFormData => {
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
  const [fieldErrors, setFieldErrors] = useState<TestimonialFormErrors>({});

  const validateFieldChange = useCallback(<K extends keyof TestimonialFormData>(
    field: K,
    value: TestimonialFormData[K],
    formData: TestimonialFormData
  ) => {
    const error = validateField(field, value, formData);
    setFieldErrors(prev => updateFieldError(prev, field, error));
    return error;
  }, []);

  const clearFieldError = useCallback((field: keyof TestimonialFormData) => {
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
