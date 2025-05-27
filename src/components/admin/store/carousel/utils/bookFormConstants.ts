import { FeaturedBadgeOption, BookFormData } from '../types/bookFormTypes';

/**
 * Constants for book form configuration
 * Extracted from BookEntryModal.tsx for reusability
 */

export const FEATURED_BADGE_OPTIONS: FeaturedBadgeOption[] = [
  { value: 'none', label: 'No Badge' },
  { value: 'new_arrival', label: 'New Arrival' },
  { value: 'staff_pick', label: 'Staff Pick' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'on_sale', label: 'On Sale' },
  { value: 'featured', label: 'Featured' }
];

export const FORM_FIELD_LIMITS = {
  BOOK_TITLE_MAX_LENGTH: 200,
  BOOK_AUTHOR_MAX_LENGTH: 100,
  BOOK_ISBN_MAX_LENGTH: 20,
  CUSTOM_DESCRIPTION_MAX_LENGTH: 300,
  OVERLAY_TEXT_MAX_LENGTH: 100,
  BOOK_IMAGE_ALT_MAX_LENGTH: 200,
  POSITION_MIN: 1,
  POSITION_MAX: 6
} as const;

export const IMAGE_UPLOAD_CONFIG = {
  BUCKET: 'store-carousel-images',
  MAX_SIZE_BYTES: 3 * 1024 * 1024, // 3MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  RECOMMENDED_DIMENSIONS: '400x600px (book cover aspect ratio)'
} as const;

export const DEFAULT_FORM_VALUES: BookFormData = {
  position: '',
  book_title: '',
  book_author: '',
  book_isbn: '',
  custom_description: '',
  featured_badge: 'none',
  overlay_text: '',
  book_image_alt: '',
  click_destination_url: '',
  is_active: true
} as const;

export const URL_REGEX = /^https?:\/\/.+/;

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  BOOK_TITLE_REQUIRED: 'Book title is required',
  BOOK_TITLE_TOO_LONG: 'Book title must be 200 characters or less',
  BOOK_AUTHOR_REQUIRED: 'Book author is required',
  BOOK_AUTHOR_TOO_LONG: 'Book author must be 100 characters or less',
  BOOK_ISBN_TOO_LONG: 'ISBN must be 20 characters or less',
  CUSTOM_DESCRIPTION_TOO_LONG: 'Description must be 300 characters or less',
  OVERLAY_TEXT_TOO_LONG: 'Overlay text must be 100 characters or less',
  BOOK_IMAGE_ALT_TOO_LONG: 'Alt text must be 200 characters or less',
  INVALID_URL: 'Please enter a valid URL starting with http:// or https://',
  INVALID_POSITION: 'Position must be between 1 and 6',
  FORM_HAS_ERRORS: 'Please fix the errors above before submitting.'
} as const;
