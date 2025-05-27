/**
 * Utility exports for book form components
 * Centralized exports for clean imports
 */

// Constants
export {
  FEATURED_BADGE_OPTIONS,
  FORM_FIELD_LIMITS,
  IMAGE_UPLOAD_CONFIG,
  DEFAULT_FORM_VALUES,
  URL_REGEX,
  VALIDATION_MESSAGES
} from './bookFormConstants';

// Form helpers
export {
  initializeFormData,
  prepareCreateData,
  prepareUpdateData,
  isEditMode,
  trimFormData,
  getDescriptionCharacterCount
} from './bookFormHelpers';

// Validation utilities
export {
  validateBookTitle,
  validateBookAuthor,
  validateBookISBN,
  validateCustomDescription,
  validateOverlayText,
  validateBookImageAlt,
  validateClickDestinationUrl,
  validatePosition,
  validateForm,
  hasValidationErrors
} from './bookValidationUtils';
