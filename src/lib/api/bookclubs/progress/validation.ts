/**
 * Reading Progress Management - Validation Functions
 * 
 * This module contains input validation logic and error handling
 * for the reading progress tracking system.
 */

import type { CreateProgressRequest, UpdateProgressRequest } from './types';

// =========================
// Validation Constants
// =========================

/**
 * Valid progress status values
 */
export const VALID_STATUS_VALUES = ['not_started', 'reading', 'finished'] as const;

/**
 * Valid progress type values
 */
export const VALID_PROGRESS_TYPES = ['percentage', 'chapter', 'page'] as const;

/**
 * Maximum notes length
 */
export const MAX_NOTES_LENGTH = 500;

/**
 * Progress percentage bounds
 */
export const PROGRESS_PERCENTAGE_MIN = 0;
export const PROGRESS_PERCENTAGE_MAX = 100;

// =========================
// Validation Functions
// =========================

/**
 * Validates progress data for create or update operations
 * 
 * @param data - Progress data to validate
 * @throws Error if validation fails
 */
export function validateProgressData(data: CreateProgressRequest | UpdateProgressRequest): void {
  // Validate status
  if (data.status && !VALID_STATUS_VALUES.includes(data.status)) {
    throw new Error('Invalid status. Must be: not_started, reading, or finished');
  }

  // Validate progress type and values
  if (data.progress_type) {
    if (!VALID_PROGRESS_TYPES.includes(data.progress_type)) {
      throw new Error('Invalid progress type. Must be: percentage, chapter, or page');
    }

    if (data.progress_type === 'percentage') {
      validatePercentageProgress(data);
    } else if (data.progress_type === 'chapter' || data.progress_type === 'page') {
      validateNumericProgress(data);
    }
  }

  // Validate notes length
  if (data.notes && data.notes.length > MAX_NOTES_LENGTH) {
    throw new Error(`Notes cannot exceed ${MAX_NOTES_LENGTH} characters`);
  }
}

/**
 * Validates percentage-based progress data
 * 
 * @param data - Progress data to validate
 * @throws Error if validation fails
 */
function validatePercentageProgress(data: CreateProgressRequest | UpdateProgressRequest): void {
  if (data.progress_percentage === undefined || 
      data.progress_percentage < PROGRESS_PERCENTAGE_MIN || 
      data.progress_percentage > PROGRESS_PERCENTAGE_MAX) {
    throw new Error(`Progress percentage must be between ${PROGRESS_PERCENTAGE_MIN} and ${PROGRESS_PERCENTAGE_MAX} for percentage type`);
  }
  
  if (data.current_progress !== undefined || data.total_progress !== undefined) {
    throw new Error('Current/total progress should not be set for percentage type');
  }
}

/**
 * Validates numeric (chapter/page) progress data
 * 
 * @param data - Progress data to validate
 * @throws Error if validation fails
 */
function validateNumericProgress(data: CreateProgressRequest | UpdateProgressRequest): void {
  if (!data.current_progress || !data.total_progress) {
    throw new Error(`Current and total progress are required for ${data.progress_type} type`);
  }
  
  if (data.current_progress < 0 || data.total_progress <= 0 || data.current_progress > data.total_progress) {
    throw new Error('Invalid current/total progress values');
  }
  
  if (data.progress_percentage !== undefined) {
    throw new Error('Progress percentage should not be set for chapter/page type');
  }
}

/**
 * Validates club ID format
 * 
 * @param clubId - Club ID to validate
 * @throws Error if validation fails
 */
export function validateClubId(clubId: string): void {
  if (!clubId || typeof clubId !== 'string' || clubId.trim().length === 0) {
    throw new Error('Club ID is required and must be a non-empty string');
  }
}

/**
 * Validates user ID format
 * 
 * @param userId - User ID to validate
 * @throws Error if validation fails
 */
export function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('User ID is required and must be a non-empty string');
  }
}

/**
 * Validates progress ID format
 * 
 * @param progressId - Progress ID to validate
 * @throws Error if validation fails
 */
export function validateProgressId(progressId: string): void {
  if (!progressId || typeof progressId !== 'string' || progressId.trim().length === 0) {
    throw new Error('Progress ID is required and must be a non-empty string');
  }
}
