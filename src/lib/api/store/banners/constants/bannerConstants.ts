/**
 * Constants for banner API services
 * Centralized configuration and constants
 */

// Database table name
export const BANNER_TABLE = 'store_promotional_banners';

// Default values
export const BANNER_DEFAULTS = {
  IS_ACTIVE: true,
  PRIORITY_ORDER_START: 1,
  ACTIVE_BANNERS_LIMIT: 5,
  CONTENT_TYPE: 'text' as const,
  ANIMATION_TYPE: 'none' as const
} as const;

// Query limits
export const BANNER_LIMITS = {
  MAX_ACTIVE_BANNERS: 10,
  MAX_BANNERS_PER_STORE: 50,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PRIORITY_ORDER: 999
} as const;

// Error messages
export const BANNER_ERRORS = {
  FETCH_FAILED: 'Failed to fetch promotional banners',
  FETCH_SINGLE_FAILED: 'Failed to fetch promotional banner',
  CREATE_FAILED: 'Failed to create promotional banner',
  UPDATE_FAILED: 'Failed to update promotional banner',
  DELETE_FAILED: 'Failed to delete promotional banner',
  REORDER_FAILED: 'Failed to reorder promotional banners',
  PRIORITY_ORDER_FAILED: 'Failed to get next priority order',
  SCHEDULE_UPDATE_FAILED: 'Failed to update banner schedule status',
  DATE_RANGE_FAILED: 'Failed to fetch scheduled banners',
  INVALID_DATE_RANGE: 'Invalid date range provided',
  INVALID_PRIORITY_ORDER: 'Invalid priority order',
  BANNER_NOT_FOUND: 'Banner not found',
  STORE_ID_REQUIRED: 'Store ID is required',
  TITLE_REQUIRED: 'Banner title is required',
  CONTENT_TYPE_REQUIRED: 'Content type is required'
} as const;

// Success messages
export const BANNER_SUCCESS = {
  CREATED: 'Banner created successfully',
  UPDATED: 'Banner updated successfully',
  DELETED: 'Banner deleted successfully',
  REORDERED: 'Banners reordered successfully',
  SCHEDULE_UPDATED: 'Banner schedule updated successfully'
} as const;

// Database error codes
export const DB_ERROR_CODES = {
  NOT_FOUND: 'PGRST116',
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514'
} as const;

// Query field selections
export const BANNER_FIELDS = {
  ALL: '*',
  BASIC: 'id, title, subtitle, content_type, is_active, priority_order',
  PRIORITY_ONLY: 'priority_order',
  ID_ONLY: 'id',
  SCHEDULE: 'id, title, start_date, end_date, is_active, priority_order'
} as const;

// Date format constants
export const DATE_FORMATS = {
  ISO_STRING: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  DATE_ONLY: 'YYYY-MM-DD',
  DISPLAY_FORMAT: 'MMM DD, YYYY'
} as const;

// Content type configurations
export const CONTENT_TYPE_CONFIG = {
  text: {
    label: 'Text Only',
    requiresImage: false,
    allowsText: true
  },
  image: {
    label: 'Image Only', 
    requiresImage: true,
    allowsText: false
  },
  mixed: {
    label: 'Text & Image',
    requiresImage: false,
    allowsText: true
  }
} as const;

// Animation type configurations
export const ANIMATION_CONFIG = {
  none: { label: 'No Animation', duration: 0 },
  fade: { label: 'Fade In/Out', duration: 500 },
  slide: { label: 'Slide', duration: 300 },
  bounce: { label: 'Bounce', duration: 600 },
  pulse: { label: 'Pulse', duration: 1000 }
} as const;

// Validation rules
export const VALIDATION_RULES = {
  TITLE_MAX_LENGTH: 200,
  SUBTITLE_MAX_LENGTH: 100,
  TEXT_CONTENT_MAX_LENGTH: 500,
  CTA_TEXT_MAX_LENGTH: 50,
  ALT_TEXT_MAX_LENGTH: 200,
  MIN_PRIORITY_ORDER: 1,
  MAX_PRIORITY_ORDER: 999
} as const;
