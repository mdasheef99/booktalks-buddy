import { BookAvailabilityRequestData, BookAvailabilityRequestStatus } from '@/types/bookAvailabilityRequests';

/**
 * Tab types for request filtering
 */
export type RequestTab = 'all' | 'club_members' | 'anonymous';

/**
 * Request counts for tab display
 */
export interface RequestCounts {
  all: number;
  club_members: number;
  anonymous: number;
}

/**
 * Request management state
 */
export interface RequestManagementState {
  requests: BookAvailabilityRequestData[];
  loading: boolean;
  error: string | null;
  updating: string | null;
  deleting: string | null;
  selectedRequest: BookAvailabilityRequestData | null;
  activeTab: RequestTab;
  searchTerm: string;
}

/**
 * Request management actions
 */
export interface RequestManagementActions {
  onUpdateStatus: (requestId: string, status: BookAvailabilityRequestStatus, notes?: string) => void;
  onDelete: (requestId: string) => void;
  onView: (request: BookAvailabilityRequestData) => void;
  onTabChange: (tab: RequestTab) => void;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
}

/**
 * Store access state
 */
export interface StoreAccessState {
  storeId: string | null;
  isValidOwner: boolean;
  loading: boolean;
  showWarning: boolean;
}

/**
 * Filter options for requests
 */
export interface RequestFilterOptions {
  searchTerm: string;
  activeTab: RequestTab;
  includeResolved?: boolean;
}

/**
 * Request statistics
 */
export interface RequestStatistics {
  total: number;
  pending: number;
  responded: number;
  resolved: number;
  pendingPercentage: number;
  respondedPercentage: number;
  resolvedPercentage: number;
}
