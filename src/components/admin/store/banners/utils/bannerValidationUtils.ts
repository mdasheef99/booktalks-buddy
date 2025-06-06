import { BannerFormData, BannerFormErrors } from '../types/bannerFormTypes';
import { FORM_FIELD_LIMITS, URL_REGEX } from './bannerFormConstants';

/**
 * Validation utilities for banner forms
 * Extracted from BannerEntryModal.tsx for reusability
 */

export const validateBannerForm = (
  formData: BannerFormData,
  imageUrl: string | null,
  editingBanner?: any
): BannerFormErrors => {
  const errors: BannerFormErrors = {};

  // Title validation
  if (!formData.title.trim()) {
    errors.title = 'Banner title is required';
  } else if (formData.title.length > FORM_FIELD_LIMITS.TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${FORM_FIELD_LIMITS.TITLE_MAX_LENGTH} characters or less`;
  }

  // Subtitle validation
  if (formData.subtitle && formData.subtitle.length > FORM_FIELD_LIMITS.SUBTITLE_MAX_LENGTH) {
    errors.subtitle = `Subtitle must be ${FORM_FIELD_LIMITS.SUBTITLE_MAX_LENGTH} characters or less`;
  }

  // Content type specific validation
  if (formData.content_type === 'image' && !imageUrl) {
    errors.banner_image = 'Image is required for image banners';
  }

  if (formData.content_type === 'text' && !formData.text_content && !formData.subtitle) {
    errors.text_content = 'Text content or subtitle is required for text banners';
  }

  // Text content validation
  if (formData.text_content && formData.text_content.length > FORM_FIELD_LIMITS.TEXT_CONTENT_MAX_LENGTH) {
    errors.text_content = `Text content must be ${FORM_FIELD_LIMITS.TEXT_CONTENT_MAX_LENGTH} characters or less`;
  }

  // CTA validation
  if (formData.cta_text && formData.cta_text.length > FORM_FIELD_LIMITS.CTA_TEXT_MAX_LENGTH) {
    errors.cta_text = `CTA text must be ${FORM_FIELD_LIMITS.CTA_TEXT_MAX_LENGTH} characters or less`;
  }

  if (formData.cta_url && !URL_REGEX.test(formData.cta_url)) {
    errors.cta_url = 'Please enter a valid URL starting with http:// or https://';
  }

  // Image alt text validation
  if (formData.banner_image_alt && formData.banner_image_alt.length > FORM_FIELD_LIMITS.IMAGE_ALT_MAX_LENGTH) {
    errors.banner_image_alt = `Alt text must be ${FORM_FIELD_LIMITS.IMAGE_ALT_MAX_LENGTH} characters or less`;
  }

  // Date validation
  if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
    errors.end_date = 'End date must be after start date';
  }

  // Priority order validation (only for new banners)
  if (!editingBanner && formData.priority_order) {
    const priority = parseInt(formData.priority_order);
    if (isNaN(priority) || priority < 1) {
      errors.priority_order = 'Priority order must be a positive number';
    }
  }

  return errors;
};

export const hasValidationErrors = (errors: BannerFormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

export const getFieldError = (errors: BannerFormErrors, fieldName: keyof BannerFormErrors): string | undefined => {
  return errors[fieldName];
};

export const validateField = (
  fieldName: keyof BannerFormData,
  value: string,
  formData: BannerFormData,
  imageUrl?: string | null
): string | undefined => {
  const tempFormData = { ...formData, [fieldName]: value };
  const errors = validateBannerForm(tempFormData, imageUrl || null);
  return errors[fieldName as keyof BannerFormErrors];
};

export const isFormValid = (formData: BannerFormData, imageUrl: string | null, editingBanner?: any): boolean => {
  const errors = validateBannerForm(formData, imageUrl, editingBanner);
  return !hasValidationErrors(errors);
};
