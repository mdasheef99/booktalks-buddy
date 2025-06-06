/**
 * Member Spotlight Manager Constants
 * Centralized constants for the member spotlight management interface
 */

import { Star, Users, BookOpen, Crown } from 'lucide-react';
import type { SpotlightType } from '@/lib/api/store/types/communityShowcaseTypes';

// ===== SPOTLIGHT TYPES =====

export const SPOTLIGHT_TYPES = [
  { 
    value: 'top_reviewer' as SpotlightType, 
    label: 'Top Reviewer', 
    icon: Star, 
    description: 'Recognized for insightful book reviews',
    color: 'bg-yellow-100 text-yellow-800'
  },
  { 
    value: 'active_member' as SpotlightType, 
    label: 'Active Member', 
    icon: Users, 
    description: 'Highly engaged community participant',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    value: 'helpful_contributor' as SpotlightType, 
    label: 'Helpful Contributor', 
    icon: BookOpen, 
    description: 'Always ready to help fellow readers',
    color: 'bg-green-100 text-green-800'
  },
  { 
    value: 'new_member' as SpotlightType, 
    label: 'New Member', 
    icon: Crown, 
    description: 'Welcome to our community!',
    color: 'bg-purple-100 text-purple-800'
  },
];

// ===== FORM VALIDATION LIMITS =====

export const VALIDATION_LIMITS = {
  DESCRIPTION_MAX_LENGTH: 300,
  DESCRIPTION_MIN_LENGTH: 10,
  SEARCH_MIN_LENGTH: 2,
} as const;

// ===== FORM FIELD NAMES =====

export const FORM_FIELDS = {
  FEATURED_MEMBER_ID: 'featured_member_id',
  SPOTLIGHT_TYPE: 'spotlight_type',
  SPOTLIGHT_DESCRIPTION: 'spotlight_description',
  SPOTLIGHT_END_DATE: 'spotlight_end_date',
} as const;

// ===== DEFAULT FORM VALUES =====

export const DEFAULT_FORM_DATA = {
  featured_member_id: '',
  spotlight_type: 'active_member' as SpotlightType,
  spotlight_description: '',
  spotlight_end_date: '',
} as const;

// ===== QUERY KEYS =====

export const SPOTLIGHT_QUERY_KEYS = {
  COMMUNITY_SHOWCASE_ADMIN: 'community-showcase-admin',
  MEMBER_SPOTLIGHTS_ADMIN: 'member-spotlights-admin',
  STORE_MEMBERS: 'store-members',
} as const;

// ===== SUCCESS MESSAGES =====

export const SUCCESS_MESSAGES = {
  CREATED: 'Member spotlight created successfully',
  UPDATED: 'Member spotlight updated successfully',
  DELETED: 'Member spotlight deleted successfully',
} as const;

// ===== ERROR MESSAGES =====

export const ERROR_MESSAGES = {
  CREATE_FAILED: 'Failed to create member spotlight',
  UPDATE_FAILED: 'Failed to update member spotlight',
  DELETE_FAILED: 'Failed to delete member spotlight',
  REQUIRED_FIELDS: 'Please fill in all required fields',
  MEMBER_REQUIRED: 'Please select a member',
  DESCRIPTION_REQUIRED: 'Please enter a description',
  DESCRIPTION_TOO_SHORT: `Description must be at least ${VALIDATION_LIMITS.DESCRIPTION_MIN_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description must be ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less`,
  INVALID_END_DATE: 'End date must be in the future',
  SEARCH_TOO_SHORT: `Search term must be at least ${VALIDATION_LIMITS.SEARCH_MIN_LENGTH} characters`,
} as const;

// ===== UI TEXT =====

export const UI_TEXT = {
  DIALOG_TITLES: {
    CREATE: 'Create Member Spotlight',
    EDIT: 'Edit Member Spotlight',
    DELETE: 'Delete Member Spotlight',
  },
  DIALOG_DESCRIPTIONS: {
    CREATE: 'Feature a community member to showcase your active readers and build trust.',
    DELETE: 'Are you sure you want to delete this member spotlight? This action cannot be undone.',
  },
  BUTTONS: {
    ADD_SPOTLIGHT: 'Add Member Spotlight',
    CREATE_FIRST_SPOTLIGHT: 'Create First Spotlight',
    CREATE_SPOTLIGHT: 'Create Spotlight',
    UPDATE_SPOTLIGHT: 'Update Spotlight',
    SAVING: 'Saving...',
    CANCEL: 'Cancel',
    DELETE: 'Delete',
  },
  LABELS: {
    SELECT_MEMBER: 'Select Member',
    SPOTLIGHT_TYPE: 'Spotlight Type',
    DESCRIPTION: 'Description',
    END_DATE: 'End Date (Optional)',
  },
  PLACEHOLDERS: {
    SEARCH_MEMBERS: 'Search members by username or display name...',
    DESCRIPTION: 'Describe why this member deserves to be featured...',
  },
  EMPTY_STATE: {
    TITLE: 'No member spotlights yet',
    DESCRIPTION: 'Feature community members to showcase your active readers and build trust.',
  },
  SEARCH_STATES: {
    SEARCHING: 'Searching...',
    NO_RESULTS: 'No members found',
    START_TYPING: 'Start typing to search members',
  },
  STATS: {
    ACTIVE_SPOTLIGHTS: (count: number) => `${count} active spotlight${count !== 1 ? 's' : ''}`,
  },
  HELP_TEXT: {
    END_DATE: 'Leave empty for permanent spotlight, or set an end date for temporary features.',
  },
} as const;

// ===== CSS CLASSES =====

export const CSS_CLASSES = {
  MEMBER_AVATAR: 'w-12 h-12 bg-gradient-to-br from-bookconnect-sage to-bookconnect-terracotta rounded-full flex items-center justify-center text-white font-semibold',
  MEMBER_AVATAR_SMALL: 'w-8 h-8 bg-gradient-to-br from-bookconnect-sage to-bookconnect-terracotta rounded-full flex items-center justify-center text-white text-sm font-semibold',
  SELECTED_MEMBER: 'bg-blue-50 border-blue-200',
  MEMBER_BUTTON: 'w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0',
  DELETE_BUTTON: 'text-red-600 hover:text-red-700',
  SPOTLIGHT_CARD: 'hover:shadow-md transition-shadow',
} as const;

// ===== SEARCH CONFIGURATION =====

export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300, // milliseconds
  MIN_SEARCH_LENGTH: VALIDATION_LIMITS.SEARCH_MIN_LENGTH,
  MAX_RESULTS: 20,
} as const;

// ===== DATE UTILITIES =====

export const DATE_CONFIG = {
  MIN_DATE: () => new Date().toISOString().split('T')[0], // Today
  DATE_FORMAT: 'YYYY-MM-DD',
} as const;

// ===== SPOTLIGHT TYPE UTILITIES =====

export const getSpotlightTypeConfig = (type: SpotlightType) => {
  return SPOTLIGHT_TYPES.find(t => t.value === type);
};

export const getSpotlightTypeLabel = (type: SpotlightType): string => {
  return getSpotlightTypeConfig(type)?.label || type;
};

export const getSpotlightTypeDescription = (type: SpotlightType): string => {
  return getSpotlightTypeConfig(type)?.description || '';
};

export const getSpotlightTypeIcon = (type: SpotlightType) => {
  return getSpotlightTypeConfig(type)?.icon || Star;
};

export const getSpotlightTypeColor = (type: SpotlightType): string => {
  return getSpotlightTypeConfig(type)?.color || 'bg-gray-100 text-gray-800';
};
