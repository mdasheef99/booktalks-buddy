/**
 * Club Management Events Components
 *
 * Centralized exports for all events-related components.
 */

// Main components
export { default as EventsSection } from './EventsSection';
export { default as EventsList } from './EventsList';
export { default as EventCreationModal } from './EventCreationModal';
export { default as EventEditModal } from './EventEditModal';
export { default as EventDetailsModal } from './EventDetailsModal';
export { default as EventAnalyticsCard } from './EventAnalyticsCard';

// Supporting components
export { default as EventsLoadingSkeleton } from './EventsLoadingSkeleton';
export { default as DeleteConfirmationModal } from './DeleteConfirmationModal';

// Re-export types from services for convenience
export type {
  ClubMeeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  MeetingQueryOptions,
  ClubEventNotification,
  MeetingAnalytics
} from '@/lib/services/clubManagementService';
