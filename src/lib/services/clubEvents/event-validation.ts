/**
 * Event Validation Module
 * 
 * Handles input validation and business rules for club events
 */

import type { CreateMeetingRequest, UpdateMeetingRequest } from '@/lib/api/clubManagement';

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Validate meeting creation data
 */
export function validateMeetingData(data: CreateMeetingRequest): ValidationResult {
  // Required fields validation
  if (!data.title || typeof data.title !== 'string') {
    return {
      valid: false,
      error: 'Meeting title is required and must be a string',
      details: { field: 'title', provided: typeof data.title }
    };
  }

  if (data.title.trim().length === 0) {
    return {
      valid: false,
      error: 'Meeting title cannot be empty',
      details: { field: 'title', length: data.title.length }
    };
  }

  if (data.title.length > 200) {
    return {
      valid: false,
      error: 'Meeting title is too long (maximum 200 characters)',
      details: { field: 'title', length: data.title.length, max: 200 }
    };
  }

  // Start time validation
  if (!data.start_time) {
    return {
      valid: false,
      error: 'Meeting start time is required',
      details: { field: 'start_time' }
    };
  }

  const startTime = new Date(data.start_time);
  if (isNaN(startTime.getTime())) {
    return {
      valid: false,
      error: 'Invalid start time format',
      details: { field: 'start_time', provided: data.start_time }
    };
  }

  // Check if start time is in the past (with 5 minute buffer)
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  if (startTime < fiveMinutesAgo) {
    return {
      valid: false,
      error: 'Meeting start time cannot be in the past',
      details: { field: 'start_time', provided: data.start_time, current: now.toISOString() }
    };
  }

  // End time validation (if provided)
  if (data.end_time) {
    const endTime = new Date(data.end_time);
    if (isNaN(endTime.getTime())) {
      return {
        valid: false,
        error: 'Invalid end time format',
        details: { field: 'end_time', provided: data.end_time }
      };
    }

    if (endTime <= startTime) {
      return {
        valid: false,
        error: 'Meeting end time must be after start time',
        details: { 
          field: 'end_time', 
          start_time: data.start_time, 
          end_time: data.end_time 
        }
      };
    }

    // Check for reasonable meeting duration (max 8 hours)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 8) {
      return {
        valid: false,
        error: 'Meeting duration cannot exceed 8 hours',
        details: { field: 'duration', hours: durationHours, max: 8 }
      };
    }
  }

  // Description validation (if provided)
  if (data.description && data.description.length > 2000) {
    return {
      valid: false,
      error: 'Meeting description is too long (maximum 2000 characters)',
      details: { field: 'description', length: data.description.length, max: 2000 }
    };
  }

  // Location validation (if provided)
  if (data.location && data.location.length > 500) {
    return {
      valid: false,
      error: 'Meeting location is too long (maximum 500 characters)',
      details: { field: 'location', length: data.location.length, max: 500 }
    };
  }

  // Virtual meeting validation
  if (data.is_virtual && data.virtual_link) {
    if (!isValidUrl(data.virtual_link)) {
      return {
        valid: false,
        error: 'Invalid virtual meeting link format',
        details: { field: 'virtual_link', provided: data.virtual_link }
      };
    }
  }

  // Max participants validation (if provided)
  if (data.max_participants !== undefined) {
    if (!Number.isInteger(data.max_participants) || data.max_participants < 1) {
      return {
        valid: false,
        error: 'Max participants must be a positive integer',
        details: { field: 'max_participants', provided: data.max_participants }
      };
    }

    if (data.max_participants > 1000) {
      return {
        valid: false,
        error: 'Max participants cannot exceed 1000',
        details: { field: 'max_participants', provided: data.max_participants, max: 1000 }
      };
    }
  }

  // Meeting type validation (if provided)
  if (data.meeting_type) {
    const validTypes = ['discussion', 'book_review', 'social', 'planning', 'other'];
    if (!validTypes.includes(data.meeting_type)) {
      return {
        valid: false,
        error: 'Invalid meeting type',
        details: { field: 'meeting_type', provided: data.meeting_type, valid: validTypes }
      };
    }
  }

  return { valid: true };
}

/**
 * Validate meeting update data
 */
export function validateMeetingUpdateData(data: UpdateMeetingRequest): ValidationResult {
  // Title validation (if provided)
  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      return {
        valid: false,
        error: 'Meeting title must be a string',
        details: { field: 'title', provided: typeof data.title }
      };
    }

    if (data.title.trim().length === 0) {
      return {
        valid: false,
        error: 'Meeting title cannot be empty',
        details: { field: 'title', length: data.title.length }
      };
    }

    if (data.title.length > 200) {
      return {
        valid: false,
        error: 'Meeting title is too long (maximum 200 characters)',
        details: { field: 'title', length: data.title.length, max: 200 }
      };
    }
  }

  // Start time validation (if provided)
  if (data.start_time !== undefined) {
    const startTime = new Date(data.start_time);
    if (isNaN(startTime.getTime())) {
      return {
        valid: false,
        error: 'Invalid start time format',
        details: { field: 'start_time', provided: data.start_time }
      };
    }
  }

  // End time validation (if provided)
  if (data.end_time !== undefined) {
    const endTime = new Date(data.end_time);
    if (isNaN(endTime.getTime())) {
      return {
        valid: false,
        error: 'Invalid end time format',
        details: { field: 'end_time', provided: data.end_time }
      };
    }

    // If both start and end times are being updated, validate relationship
    if (data.start_time !== undefined) {
      const startTime = new Date(data.start_time);
      if (endTime <= startTime) {
        return {
          valid: false,
          error: 'Meeting end time must be after start time',
          details: { 
            field: 'end_time', 
            start_time: data.start_time, 
            end_time: data.end_time 
          }
        };
      }
    }
  }

  // Description validation (if provided)
  if (data.description !== undefined && data.description && data.description.length > 2000) {
    return {
      valid: false,
      error: 'Meeting description is too long (maximum 2000 characters)',
      details: { field: 'description', length: data.description.length, max: 2000 }
    };
  }

  // Status validation (if provided)
  if (data.status !== undefined) {
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'archived'];
    if (!validStatuses.includes(data.status)) {
      return {
        valid: false,
        error: 'Invalid meeting status',
        details: { field: 'status', provided: data.status, valid: validStatuses }
      };
    }
  }

  return { valid: true };
}

/**
 * Validate RSVP status
 */
export function validateRSVPStatus(status: string): ValidationResult {
  const validStatuses = ['going', 'maybe', 'not_going'];

  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      error: 'Invalid RSVP status',
      details: { provided: status, valid: validStatuses }
    };
  }

  return { valid: true };
}

/**
 * Validate notification type
 */
export function validateNotificationType(type: string): ValidationResult {
  const validTypes = ['meeting_created', 'meeting_updated', 'meeting_cancelled', 'meeting_reminder'];
  
  if (!validTypes.includes(type)) {
    return {
      valid: false,
      error: 'Invalid notification type',
      details: { provided: type, valid: validTypes }
    };
  }

  return { valid: true };
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Check if a string is a valid URL
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
