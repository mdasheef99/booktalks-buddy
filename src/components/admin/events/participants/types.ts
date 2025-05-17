import { Event } from '@/lib/api/bookclubs/events';
import { Dispatch, SetStateAction } from 'react';

// Define RSVP status type
export type RsvpStatus = 'going' | 'maybe' | 'not_going';

// Define participant type that matches the API return type
export interface Participant {
  event_id: string;
  user_id: string;
  rsvp_status: RsvpStatus;
  rsvp_at: string;
  user: {
    username: string | null;
    email: string;
  };
}

// Define participant counts type
export interface ParticipantCounts {
  going: number;
  maybe: number;
  not_going: number;
  total: number;
}

// Define loading states for different data fetching operations
export interface LoadingStates {
  event: boolean;
  participants: boolean;
  counts: boolean;
}

// Define error states for different data fetching operations
export interface ErrorStates {
  event: Error | null;
  participants: Error | null;
  counts: Error | null;
}

// Props for the main EventParticipantsList component
export interface EventParticipantsListProps {
  eventId: string;
}

// Props for the ParticipantListWithPagination component
export interface ParticipantListWithPaginationProps {
  participants: Participant[];
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  itemsPerPage: number;
  loading?: boolean;
}

// Props for the ParticipantListHeader component
export interface ParticipantListHeaderProps {
  event: Event | null;
  loading: LoadingStates;
  isFullyLoading: boolean;
  handleRefresh: () => void;
  exportParticipants: () => void;
  exportFormat: 'filtered' | 'all';
  setExportFormat: Dispatch<SetStateAction<'filtered' | 'all'>>;
  exportLoading: boolean;
  sendEmailToParticipants: () => void;
  participants: Participant[];
}

// Props for the ParticipantListFilters component
export interface ParticipantListFiltersProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  itemsPerPage: number;
  setItemsPerPage: Dispatch<SetStateAction<number>>;
  isFullyLoading: boolean;
  participants: Participant[];
  filteredParticipants: Participant[];
  debouncedSearchQuery: string;
}

// Props for the ParticipantListTabs component
export interface ParticipantListTabsProps {
  activeTab: RsvpStatus | 'all';
  setActiveTab: Dispatch<SetStateAction<RsvpStatus | 'all'>>;
  counts: ParticipantCounts;
  filteredParticipants: Participant[];
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  itemsPerPage: number;
  loading: LoadingStates;
}

// Props for the ParticipantListSummary component
export interface ParticipantListSummaryProps {
  counts: ParticipantCounts;
  event: Event | null;
}

// Props for the ParticipantListError component
export interface ParticipantListErrorProps {
  errors: ErrorStates;
  handleRefresh: () => void;
}

// Props for the ParticipantListEmpty component
export interface ParticipantListEmptyProps {
  loading: LoadingStates;
  event: Event | null;
  handleRefresh: () => void;
}

// Export format type
export type ExportFormat = 'filtered' | 'all';
