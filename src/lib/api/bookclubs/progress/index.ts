/**
 * Reading Progress Management API - Main Export
 *
 * This file serves as the main entry point for the reading progress API,
 * exporting all functions, types, and utilities for use throughout the application.
 * 
 * The module has been refactored from a monolithic 520+ line file into a
 * modular structure for better maintainability and organization.
 */

// =========================
// Type Definitions
// =========================
export type {
  // Core data types
  ReadingProgress,
  ProgressStatus,
  ProgressType,

  // API request types
  CreateProgressRequest,
  UpdateProgressRequest,

  // API response types
  ClubProgressStats,
  MemberProgressSummary,
  FeatureToggleResponse
} from './types';

// =========================
// Core CRUD Functions
// =========================

// Create/Update Operations
export {
  upsertReadingProgress
} from './crud';

// Read Operations
export {
  getUserReadingProgress,
  getClubReadingProgress,
  getClubProgressStats
} from './crud';

// Delete Operations
export {
  deleteReadingProgress
} from './crud';

// =========================
// Feature Toggle Functions
// =========================
export {
  toggleClubProgressTracking,
  isProgressTrackingEnabled,
  getProgressTrackingSettings,
  enableProgressTracking,
  disableProgressTracking,
  canManageProgressTracking
} from './features';

// =========================
// Utility Functions
// =========================
export {
  formatProgressDisplay,
  calculateCompletionPercentage,
  formatProgressStatus,
  getCurrentBookProgress,
  hasReadingProgress,
  getLatestUserProgress,
  isValidProgressType,
  isValidProgressStatus,
  sanitizeNotes
} from './utils';

// =========================
// Validation Functions
// =========================
export {
  validateProgressData,
  validateClubId,
  validateUserId,
  validateProgressId,
  VALID_STATUS_VALUES,
  VALID_PROGRESS_TYPES,
  MAX_NOTES_LENGTH,
  PROGRESS_PERCENTAGE_MIN,
  PROGRESS_PERCENTAGE_MAX
} from './validation';

// =========================
// Configuration and Constants
// =========================

/**
 * Default configuration for progress tracking
 */
export const PROGRESS_CONFIG = {
  MAX_NOTES_LENGTH: 500,
  PROGRESS_PERCENTAGE_MIN: 0,
  PROGRESS_PERCENTAGE_MAX: 100,
  VALID_STATUS_VALUES: ['not_started', 'reading', 'finished'] as const,
  VALID_PROGRESS_TYPES: ['percentage', 'chapter', 'page'] as const
} as const;

/**
 * Progress tracking feature limits and settings
 */
export const PROGRESS_LIMITS = {
  MAX_NOTES_LENGTH: 500,
  MIN_PROGRESS_VALUE: 0,
  MAX_PROGRESS_PERCENTAGE: 100,
  DEFAULT_PRIVACY_SETTING: false
} as const;

// =========================
// Helper Functions for Components
// =========================

/**
 * Get progress completion percentage for any progress type
 * 
 * @param progress - Reading progress data
 * @returns Completion percentage (0-100)
 */
export function getProgressPercentage(progress: ReadingProgress): number {
  if (progress.status === 'not_started') return 0;
  if (progress.status === 'finished') return 100;
  
  if (progress.progress_type === 'percentage' && progress.progress_percentage !== null) {
    return progress.progress_percentage;
  } else if (progress.current_progress && progress.total_progress) {
    return Math.round((progress.current_progress / progress.total_progress) * 100);
  }
  
  return 0;
}

/**
 * Check if progress is considered complete
 * 
 * @param progress - Reading progress data
 * @returns True if progress indicates completion
 */
export function isProgressComplete(progress: ReadingProgress): boolean {
  return progress.status === 'finished';
}

/**
 * Get progress status color for UI components
 * 
 * @param status - Progress status
 * @returns CSS color class or hex color
 */
export function getProgressStatusColor(status: ProgressStatus): string {
  switch (status) {
    case 'not_started':
      return '#6B7280'; // gray-500
    case 'reading':
      return '#3B82F6'; // blue-500
    case 'finished':
      return '#10B981'; // green-500
    default:
      return '#6B7280';
  }
}

/**
 * Format progress for accessibility (screen readers)
 * 
 * @param progress - Reading progress data
 * @returns Accessible description string
 */
export function getProgressAccessibilityLabel(progress: ReadingProgress): string {
  const display = formatProgressDisplay(progress);
  const percentage = getProgressPercentage(progress);
  
  return `Reading progress: ${display}, ${percentage}% complete`;
}

// =========================
// Backward Compatibility
// =========================

// Re-export types with original names for backward compatibility
import type { 
  ReadingProgress,
  CreateProgressRequest,
  UpdateProgressRequest,
  ClubProgressStats,
  MemberProgressSummary
} from './types';

// Ensure all original exports are available
export type {
  ReadingProgress as IReadingProgress,
  CreateProgressRequest as ICreateProgressRequest,
  UpdateProgressRequest as IUpdateProgressRequest,
  ClubProgressStats as IClubProgressStats,
  MemberProgressSummary as IMemberProgressSummary
};
