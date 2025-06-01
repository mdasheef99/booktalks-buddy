/**
 * Progress tracking components for book clubs
 * 
 * This module provides UI components for the reading progress tracking feature,
 * including progress updates, indicators, and management controls.
 */

export { default as ProgressUpdateModal } from './ProgressUpdateModal';
export { default as ProgressIndicator } from './ProgressIndicator';
export { default as ProgressToggleControl } from './ProgressToggleControl';
export { default as ClubProgressDetailsModal } from './ClubProgressDetailsModal';
export { default as ProgressTrackingInfoModal } from './ProgressTrackingInfoModal';

// Export hooks
export { useProgressRealtime } from './hooks/useProgressRealtime';

// Re-export types for convenience
export type {
  ReadingProgress,
  CreateProgressRequest,
  UpdateProgressRequest,
  ClubProgressStats,
  MemberProgressSummary,
} from '@/lib/api/bookclubs/progress';
