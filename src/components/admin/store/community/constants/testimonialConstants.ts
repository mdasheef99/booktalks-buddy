/**
 * Testimonial Manager Constants
 * Centralized constants for the testimonial management interface
 */

import type { TestimonialSourceType, TestimonialApprovalStatus } from '@/lib/api/store/types/communityShowcaseTypes';

// ===== SOURCE TYPES =====

export const SOURCE_TYPES: Array<{ value: TestimonialSourceType; label: string }> = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'review_import', label: 'Imported Review' },
  { value: 'survey', label: 'Survey Response' },
  { value: 'social_media', label: 'Social Media' },
];

// ===== APPROVAL STATUS STYLING =====

export const APPROVAL_STATUS_COLORS: Record<TestimonialApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// ===== FORM VALIDATION LIMITS =====

export const VALIDATION_LIMITS = {
  CUSTOMER_NAME_MAX_LENGTH: 100,
  TESTIMONIAL_TEXT_MAX_LENGTH: 500,
  TESTIMONIAL_TEXT_MIN_LENGTH: 10,
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;

// ===== FORM FIELD NAMES =====

export const FORM_FIELDS = {
  CUSTOMER_NAME: 'customer_name',
  TESTIMONIAL_TEXT: 'testimonial_text',
  RATING: 'rating',
  SOURCE_TYPE: 'source_type',
  SOURCE_URL: 'source_url',
  IS_ANONYMOUS: 'is_anonymous',
  IS_FEATURED: 'is_featured',
} as const;

// ===== DEFAULT FORM VALUES =====

export const DEFAULT_FORM_DATA = {
  customer_name: '',
  testimonial_text: '',
  rating: undefined,
  source_type: 'manual' as TestimonialSourceType,
  source_url: '',
  is_anonymous: false,
  is_featured: false,
} as const;

// ===== QUERY KEYS =====

export const TESTIMONIAL_QUERY_KEYS = {
  COMMUNITY_SHOWCASE_ADMIN: 'community-showcase-admin',
  TESTIMONIALS_ADMIN: 'testimonials-admin',
} as const;

// ===== SUCCESS MESSAGES =====

export const SUCCESS_MESSAGES = {
  CREATED: 'Testimonial created successfully',
  UPDATED: 'Testimonial updated successfully',
  DELETED: 'Testimonial deleted successfully',
  APPROVAL_UPDATED: 'Testimonial approval updated',
} as const;

// ===== ERROR MESSAGES =====

export const ERROR_MESSAGES = {
  CREATE_FAILED: 'Failed to create testimonial',
  UPDATE_FAILED: 'Failed to update testimonial',
  DELETE_FAILED: 'Failed to delete testimonial',
  APPROVAL_FAILED: 'Failed to update approval status',
  TESTIMONIAL_TEXT_REQUIRED: 'Please enter testimonial text',
  TESTIMONIAL_TEXT_TOO_SHORT: `Testimonial must be at least ${VALIDATION_LIMITS.TESTIMONIAL_TEXT_MIN_LENGTH} characters`,
  CUSTOMER_NAME_REQUIRED: 'Please enter customer name or mark as anonymous',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_RATING: 'Rating must be between 1 and 5',
} as const;

// ===== UI TEXT =====

export const UI_TEXT = {
  DIALOG_TITLES: {
    CREATE: 'Add New Testimonial',
    EDIT: 'Edit Testimonial',
    DELETE: 'Delete Testimonial',
  },
  DIALOG_DESCRIPTIONS: {
    CREATE: 'Create a customer testimonial to build social proof and trust.',
    DELETE: 'Are you sure you want to delete this testimonial? This action cannot be undone.',
  },
  BUTTONS: {
    ADD_TESTIMONIAL: 'Add Testimonial',
    ADD_FIRST_TESTIMONIAL: 'Add First Testimonial',
    CREATE_TESTIMONIAL: 'Create Testimonial',
    UPDATE_TESTIMONIAL: 'Update Testimonial',
    SAVING: 'Saving...',
    CANCEL: 'Cancel',
    DELETE: 'Delete',
  },
  LABELS: {
    CUSTOMER_NAME: 'Customer Name',
    TESTIMONIAL_TEXT: 'Testimonial Text',
    RATING: 'Rating (Optional)',
    SOURCE_TYPE: 'Source Type',
    SOURCE_URL: 'Source URL (Optional)',
    ANONYMOUS_TESTIMONIAL: 'Anonymous testimonial',
    FEATURED_TESTIMONIAL: 'Featured testimonial',
  },
  PLACEHOLDERS: {
    CUSTOMER_NAME: 'Enter customer name',
    TESTIMONIAL_TEXT: 'Enter the customer testimonial...',
    SOURCE_URL: 'https://...',
    RATING: 'Select rating',
  },
  EMPTY_STATE: {
    TITLE: 'No testimonials yet',
    DESCRIPTION: 'Start collecting customer testimonials to build social proof and trust.',
  },
  STATS: {
    APPROVED_PENDING: (approved: number, pending: number) => `${approved} approved • ${pending} pending`,
  },
} as const;

// ===== RATING OPTIONS =====

export const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

// ===== CSS CLASSES =====

export const CSS_CLASSES = {
  STAR_FILLED: 'text-yellow-400 fill-current',
  STAR_EMPTY: 'text-gray-300',
  APPROVAL_BUTTON_APPROVE: 'text-green-600 hover:text-green-700',
  APPROVAL_BUTTON_REJECT: 'text-red-600 hover:text-red-700',
  DELETE_BUTTON: 'text-red-600 hover:text-red-700',
  FEATURED_BADGE: 'bg-purple-100 text-purple-800',
  SOURCE_LINK: 'text-blue-600 hover:underline',
} as const;
