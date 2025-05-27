/**
 * Utility functions for banner API services
 * Common helper functions and data transformations
 */

import { CreateBannerData, UpdateBannerData, BannerValidationResult, DateRange } from '../types/bannerTypes';
import { BANNER_DEFAULTS, VALIDATION_RULES, BANNER_ERRORS } from '../constants/bannerConstants';

/**
 * Get current ISO timestamp
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Check if a date string is valid
 */
export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Check if date range is valid
 */
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return false;
  }
  return new Date(startDate) <= new Date(endDate);
};

/**
 * Normalize create banner data with defaults
 */
export const normalizeCreateBannerData = (data: CreateBannerData): CreateBannerData => {
  return {
    ...data,
    is_active: data.is_active ?? BANNER_DEFAULTS.IS_ACTIVE,
    content_type: data.content_type || BANNER_DEFAULTS.CONTENT_TYPE,
    animation_type: data.animation_type || BANNER_DEFAULTS.ANIMATION_TYPE
  };
};

/**
 * Clean update data by removing undefined values
 */
export const cleanUpdateData = (data: UpdateBannerData): UpdateBannerData => {
  const cleaned: UpdateBannerData = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      (cleaned as any)[key] = value;
    }
  });
  
  return cleaned;
};

/**
 * Validate banner data
 */
export const validateBannerData = (data: CreateBannerData | UpdateBannerData): BannerValidationResult => {
  const errors: string[] = [];

  // Check required fields for create data
  if ('store_id' in data) {
    if (!data.store_id?.trim()) {
      errors.push(BANNER_ERRORS.STORE_ID_REQUIRED);
    }
    if (!data.title?.trim()) {
      errors.push(BANNER_ERRORS.TITLE_REQUIRED);
    }
    if (!data.content_type) {
      errors.push(BANNER_ERRORS.CONTENT_TYPE_REQUIRED);
    }
  }

  // Validate field lengths
  if (data.title && data.title.length > VALIDATION_RULES.TITLE_MAX_LENGTH) {
    errors.push(`Title must be ${VALIDATION_RULES.TITLE_MAX_LENGTH} characters or less`);
  }

  if (data.subtitle && data.subtitle.length > VALIDATION_RULES.SUBTITLE_MAX_LENGTH) {
    errors.push(`Subtitle must be ${VALIDATION_RULES.SUBTITLE_MAX_LENGTH} characters or less`);
  }

  if (data.text_content && data.text_content.length > VALIDATION_RULES.TEXT_CONTENT_MAX_LENGTH) {
    errors.push(`Text content must be ${VALIDATION_RULES.TEXT_CONTENT_MAX_LENGTH} characters or less`);
  }

  if (data.cta_text && data.cta_text.length > VALIDATION_RULES.CTA_TEXT_MAX_LENGTH) {
    errors.push(`CTA text must be ${VALIDATION_RULES.CTA_TEXT_MAX_LENGTH} characters or less`);
  }

  if (data.banner_image_alt && data.banner_image_alt.length > VALIDATION_RULES.ALT_TEXT_MAX_LENGTH) {
    errors.push(`Alt text must be ${VALIDATION_RULES.ALT_TEXT_MAX_LENGTH} characters or less`);
  }

  // Validate priority order
  if (data.priority_order !== undefined) {
    if (data.priority_order < VALIDATION_RULES.MIN_PRIORITY_ORDER || 
        data.priority_order > VALIDATION_RULES.MAX_PRIORITY_ORDER) {
      errors.push(BANNER_ERRORS.INVALID_PRIORITY_ORDER);
    }
  }

  // Validate date range
  if (data.start_date && data.end_date) {
    if (!isValidDateRange(data.start_date, data.end_date)) {
      errors.push(BANNER_ERRORS.INVALID_DATE_RANGE);
    }
  }

  // Validate individual dates
  if (data.start_date && !isValidDateString(data.start_date)) {
    errors.push('Invalid start date format');
  }

  if (data.end_date && !isValidDateString(data.end_date)) {
    errors.push('Invalid end date format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Build date range query conditions
 */
export const buildDateRangeQuery = (dateRange: DateRange) => {
  return {
    startCondition: `start_date.is.null,start_date.lte.${dateRange.endDate}`,
    endCondition: `end_date.is.null,end_date.gte.${dateRange.startDate}`
  };
};

/**
 * Build active banner query conditions
 */
export const buildActiveBannerQuery = (currentTime?: string) => {
  const now = currentTime || getCurrentTimestamp();
  return {
    startCondition: `start_date.is.null,start_date.lte.${now}`,
    endCondition: `end_date.is.null,end_date.gt.${now}`
  };
};

/**
 * Check if banner is currently active based on dates
 */
export const isBannerActive = (banner: { start_date?: string; end_date?: string; is_active: boolean }, currentTime?: string): boolean => {
  if (!banner.is_active) {
    return false;
  }

  const now = new Date(currentTime || getCurrentTimestamp());
  
  // Check start date
  if (banner.start_date) {
    const startDate = new Date(banner.start_date);
    if (startDate > now) {
      return false;
    }
  }

  // Check end date
  if (banner.end_date) {
    const endDate = new Date(banner.end_date);
    if (endDate <= now) {
      return false;
    }
  }

  return true;
};

/**
 * Sort banners by priority order
 */
export const sortByPriority = <T extends { priority_order: number }>(banners: T[]): T[] => {
  return [...banners].sort((a, b) => a.priority_order - b.priority_order);
};

/**
 * Generate next available priority order
 */
export const calculateNextPriorityOrder = (existingOrders: number[]): number => {
  if (existingOrders.length === 0) {
    return BANNER_DEFAULTS.PRIORITY_ORDER_START;
  }
  
  const maxOrder = Math.max(...existingOrders);
  return maxOrder + 1;
};

/**
 * Check if priority order conflicts exist
 */
export const hasPriorityConflicts = (positions: { id: string; priority_order: number }[]): boolean => {
  const orders = positions.map(p => p.priority_order);
  const uniqueOrders = new Set(orders);
  return orders.length !== uniqueOrders.size;
};
