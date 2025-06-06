/**
 * Testimonial Validation Utilities
 * Form validation logic for testimonial management
 */

import type { TestimonialFormData } from '@/lib/api/store/types/communityShowcaseTypes';
import type { TestimonialFormErrors } from '../types/testimonialTypes';
import { VALIDATION_LIMITS, ERROR_MESSAGES } from '../constants/testimonialConstants';

// ===== INDIVIDUAL FIELD VALIDATORS =====

/**
 * Validate customer name field
 */
export const validateCustomerName = (name: string, isAnonymous: boolean): string | undefined => {
  if (isAnonymous) {
    return undefined; // No validation needed for anonymous testimonials
  }
  
  if (!name || !name.trim()) {
    return ERROR_MESSAGES.CUSTOMER_NAME_REQUIRED;
  }
  
  if (name.trim().length > VALIDATION_LIMITS.CUSTOMER_NAME_MAX_LENGTH) {
    return `Customer name must be ${VALIDATION_LIMITS.CUSTOMER_NAME_MAX_LENGTH} characters or less`;
  }
  
  return undefined;
};

/**
 * Validate testimonial text field
 */
export const validateTestimonialText = (text: string): string | undefined => {
  if (!text || !text.trim()) {
    return ERROR_MESSAGES.TESTIMONIAL_TEXT_REQUIRED;
  }
  
  const trimmedText = text.trim();
  
  if (trimmedText.length < VALIDATION_LIMITS.TESTIMONIAL_TEXT_MIN_LENGTH) {
    return ERROR_MESSAGES.TESTIMONIAL_TEXT_TOO_SHORT;
  }
  
  if (trimmedText.length > VALIDATION_LIMITS.TESTIMONIAL_TEXT_MAX_LENGTH) {
    return `Testimonial must be ${VALIDATION_LIMITS.TESTIMONIAL_TEXT_MAX_LENGTH} characters or less`;
  }
  
  return undefined;
};

/**
 * Validate rating field
 */
export const validateRating = (rating?: number): string | undefined => {
  if (rating === undefined || rating === null) {
    return undefined; // Rating is optional
  }
  
  if (!Number.isInteger(rating) || rating < VALIDATION_LIMITS.RATING_MIN || rating > VALIDATION_LIMITS.RATING_MAX) {
    return ERROR_MESSAGES.INVALID_RATING;
  }
  
  return undefined;
};

/**
 * Validate source URL field
 */
export const validateSourceUrl = (url?: string): string | undefined => {
  if (!url || !url.trim()) {
    return undefined; // URL is optional
  }
  
  try {
    new URL(url.trim());
    return undefined;
  } catch {
    return ERROR_MESSAGES.INVALID_URL;
  }
};

// ===== FORM VALIDATION =====

/**
 * Validate entire testimonial form
 */
export const validateTestimonialForm = (formData: TestimonialFormData): TestimonialFormErrors => {
  const errors: TestimonialFormErrors = {};
  
  // Validate customer name
  const customerNameError = validateCustomerName(formData.customer_name || '', formData.is_anonymous);
  if (customerNameError) {
    errors.customer_name = customerNameError;
  }
  
  // Validate testimonial text
  const testimonialTextError = validateTestimonialText(formData.testimonial_text);
  if (testimonialTextError) {
    errors.testimonial_text = testimonialTextError;
  }
  
  // Validate rating
  const ratingError = validateRating(formData.rating);
  if (ratingError) {
    errors.rating = ratingError;
  }
  
  // Validate source URL
  const sourceUrlError = validateSourceUrl(formData.source_url);
  if (sourceUrlError) {
    errors.source_url = sourceUrlError;
  }
  
  return errors;
};

/**
 * Check if form has any validation errors
 */
export const hasValidationErrors = (errors: TestimonialFormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Check if form is valid for submission
 */
export const isFormValid = (formData: TestimonialFormData): boolean => {
  const errors = validateTestimonialForm(formData);
  return !hasValidationErrors(errors);
};

// ===== DATA SANITIZATION =====

/**
 * Sanitize form data before submission
 */
export const sanitizeFormData = (formData: TestimonialFormData): TestimonialFormData => {
  return {
    ...formData,
    customer_name: formData.is_anonymous ? undefined : formData.customer_name?.trim(),
    testimonial_text: formData.testimonial_text.trim(),
    source_url: formData.source_url?.trim() || undefined,
  };
};

/**
 * Prepare form data for API submission
 */
export const prepareSubmissionData = (formData: TestimonialFormData): TestimonialFormData => {
  const sanitized = sanitizeFormData(formData);
  
  // Additional preparation logic can be added here
  return sanitized;
};

// ===== VALIDATION HELPERS =====

/**
 * Get first validation error message
 */
export const getFirstError = (errors: TestimonialFormErrors): string | undefined => {
  const errorKeys = Object.keys(errors) as (keyof TestimonialFormErrors)[];
  return errorKeys.length > 0 ? errors[errorKeys[0]] : undefined;
};

/**
 * Check if specific field has error
 */
export const hasFieldError = (errors: TestimonialFormErrors, field: keyof TestimonialFormErrors): boolean => {
  return Boolean(errors[field]);
};

/**
 * Get error message for specific field
 */
export const getFieldError = (errors: TestimonialFormErrors, field: keyof TestimonialFormErrors): string | undefined => {
  return errors[field];
};

// ===== REAL-TIME VALIDATION =====

/**
 * Validate single field in real-time
 */
export const validateField = (
  field: keyof TestimonialFormData, 
  value: any, 
  formData: TestimonialFormData
): string | undefined => {
  switch (field) {
    case 'customer_name':
      return validateCustomerName(value || '', formData.is_anonymous);
    case 'testimonial_text':
      return validateTestimonialText(value || '');
    case 'rating':
      return validateRating(value);
    case 'source_url':
      return validateSourceUrl(value);
    default:
      return undefined;
  }
};

/**
 * Update errors for a specific field
 */
export const updateFieldError = (
  errors: TestimonialFormErrors,
  field: keyof TestimonialFormData,
  error: string | undefined
): TestimonialFormErrors => {
  const newErrors = { ...errors };
  
  if (error) {
    newErrors[field as keyof TestimonialFormErrors] = error;
  } else {
    delete newErrors[field as keyof TestimonialFormErrors];
  }
  
  return newErrors;
};
