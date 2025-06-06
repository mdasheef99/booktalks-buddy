/**
 * Member Spotlight Validation Utilities
 * Form validation logic for member spotlight management
 */

import type { MemberSpotlightFormData } from '@/lib/api/store/types/communityShowcaseTypes';
import type { MemberSpotlightFormErrors } from '../types/memberSpotlightTypes';
import { VALIDATION_LIMITS, ERROR_MESSAGES } from '../constants/memberSpotlightConstants';

// ===== INDIVIDUAL FIELD VALIDATORS =====

/**
 * Validate featured member ID field
 */
export const validateFeaturedMemberId = (memberId: string): string | undefined => {
  if (!memberId || !memberId.trim()) {
    return ERROR_MESSAGES.MEMBER_REQUIRED;
  }
  
  return undefined;
};

/**
 * Validate spotlight description field
 */
export const validateSpotlightDescription = (description: string): string | undefined => {
  if (!description || !description.trim()) {
    return ERROR_MESSAGES.DESCRIPTION_REQUIRED;
  }
  
  const trimmedDescription = description.trim();
  
  if (trimmedDescription.length < VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH) {
    return ERROR_MESSAGES.DESCRIPTION_TOO_SHORT;
  }
  
  if (trimmedDescription.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
    return ERROR_MESSAGES.DESCRIPTION_TOO_LONG;
  }
  
  return undefined;
};

/**
 * Validate spotlight end date field
 */
export const validateSpotlightEndDate = (endDate?: string): string | undefined => {
  if (!endDate || !endDate.trim()) {
    return undefined; // End date is optional
  }
  
  const date = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  if (isNaN(date.getTime())) {
    return 'Please enter a valid date';
  }
  
  if (date <= today) {
    return ERROR_MESSAGES.INVALID_END_DATE;
  }
  
  return undefined;
};

/**
 * Validate spotlight type field
 */
export const validateSpotlightType = (type: string): string | undefined => {
  const validTypes = ['top_reviewer', 'active_member', 'helpful_contributor', 'new_member'];
  
  if (!type || !validTypes.includes(type)) {
    return 'Please select a valid spotlight type';
  }
  
  return undefined;
};

// ===== FORM VALIDATION =====

/**
 * Validate entire member spotlight form
 */
export const validateMemberSpotlightForm = (formData: MemberSpotlightFormData): MemberSpotlightFormErrors => {
  const errors: MemberSpotlightFormErrors = {};
  
  // Validate featured member ID
  const memberIdError = validateFeaturedMemberId(formData.featured_member_id);
  if (memberIdError) {
    errors.featured_member_id = memberIdError;
  }
  
  // Validate spotlight type
  const typeError = validateSpotlightType(formData.spotlight_type);
  if (typeError) {
    errors.spotlight_type = typeError;
  }
  
  // Validate description
  const descriptionError = validateSpotlightDescription(formData.spotlight_description);
  if (descriptionError) {
    errors.spotlight_description = descriptionError;
  }
  
  // Validate end date
  const endDateError = validateSpotlightEndDate(formData.spotlight_end_date);
  if (endDateError) {
    errors.spotlight_end_date = endDateError;
  }
  
  return errors;
};

/**
 * Check if form has any validation errors
 */
export const hasValidationErrors = (errors: MemberSpotlightFormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Check if form is valid for submission
 */
export const isFormValid = (formData: MemberSpotlightFormData): boolean => {
  const errors = validateMemberSpotlightForm(formData);
  return !hasValidationErrors(errors);
};

// ===== DATA SANITIZATION =====

/**
 * Sanitize form data before submission
 */
export const sanitizeFormData = (formData: MemberSpotlightFormData): MemberSpotlightFormData => {
  return {
    ...formData,
    featured_member_id: formData.featured_member_id.trim(),
    spotlight_description: formData.spotlight_description.trim(),
    spotlight_end_date: formData.spotlight_end_date?.trim() || undefined,
  };
};

/**
 * Prepare form data for API submission
 */
export const prepareSubmissionData = (formData: MemberSpotlightFormData): MemberSpotlightFormData => {
  const sanitized = sanitizeFormData(formData);
  
  // Additional preparation logic can be added here
  return sanitized;
};

// ===== VALIDATION HELPERS =====

/**
 * Get first validation error message
 */
export const getFirstError = (errors: MemberSpotlightFormErrors): string | undefined => {
  const errorKeys = Object.keys(errors) as (keyof MemberSpotlightFormErrors)[];
  return errorKeys.length > 0 ? errors[errorKeys[0]] : undefined;
};

/**
 * Check if specific field has error
 */
export const hasFieldError = (errors: MemberSpotlightFormErrors, field: keyof MemberSpotlightFormErrors): boolean => {
  return Boolean(errors[field]);
};

/**
 * Get error message for specific field
 */
export const getFieldError = (errors: MemberSpotlightFormErrors, field: keyof MemberSpotlightFormErrors): string | undefined => {
  return errors[field];
};

// ===== REAL-TIME VALIDATION =====

/**
 * Validate single field in real-time
 */
export const validateField = (
  field: keyof MemberSpotlightFormData, 
  value: any, 
  formData: MemberSpotlightFormData
): string | undefined => {
  switch (field) {
    case 'featured_member_id':
      return validateFeaturedMemberId(value || '');
    case 'spotlight_type':
      return validateSpotlightType(value || '');
    case 'spotlight_description':
      return validateSpotlightDescription(value || '');
    case 'spotlight_end_date':
      return validateSpotlightEndDate(value);
    default:
      return undefined;
  }
};

/**
 * Update errors for a specific field
 */
export const updateFieldError = (
  errors: MemberSpotlightFormErrors,
  field: keyof MemberSpotlightFormData,
  error: string | undefined
): MemberSpotlightFormErrors => {
  const newErrors = { ...errors };
  
  if (error) {
    newErrors[field as keyof MemberSpotlightFormErrors] = error;
  } else {
    delete newErrors[field as keyof MemberSpotlightFormErrors];
  }
  
  return newErrors;
};

// ===== SEARCH VALIDATION =====

/**
 * Validate search term
 */
export const validateSearchTerm = (searchTerm: string): string | undefined => {
  if (searchTerm.length > 0 && searchTerm.length < VALIDATION_LIMITS.SEARCH_MIN_LENGTH) {
    return ERROR_MESSAGES.SEARCH_TOO_SHORT;
  }
  
  return undefined;
};

/**
 * Check if search term is valid
 */
export const isValidSearchTerm = (searchTerm: string): boolean => {
  return searchTerm.length === 0 || searchTerm.length >= VALIDATION_LIMITS.SEARCH_MIN_LENGTH;
};

// ===== BUSINESS LOGIC VALIDATION =====

/**
 * Check if member can be featured (business rules)
 */
export const canMemberBeFeatured = (memberId: string, existingSpotlights: any[]): boolean => {
  // Check if member is already featured in an active spotlight
  const activeSpotlight = existingSpotlights.find(
    spotlight => spotlight.featured_member_id === memberId && 
    (!spotlight.spotlight_end_date || new Date(spotlight.spotlight_end_date) > new Date())
  );
  
  return !activeSpotlight;
};

/**
 * Validate member selection against business rules
 */
export const validateMemberSelection = (
  memberId: string, 
  existingSpotlights: any[],
  currentSpotlightId?: string
): string | undefined => {
  if (!memberId) {
    return ERROR_MESSAGES.MEMBER_REQUIRED;
  }
  
  // Skip validation if editing the same spotlight
  const filteredSpotlights = currentSpotlightId 
    ? existingSpotlights.filter(s => s.id !== currentSpotlightId)
    : existingSpotlights;
  
  if (!canMemberBeFeatured(memberId, filteredSpotlights)) {
    return 'This member is already featured in an active spotlight';
  }
  
  return undefined;
};
