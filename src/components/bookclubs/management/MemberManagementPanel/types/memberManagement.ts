/**
 * Enhanced types for Member Management Panel
 * Extracted and enhanced from the original MemberManagementPanel.tsx
 */

// Re-export existing types for backward compatibility
export type {
  Member,
  JoinRequest,
  EnhancedJoinRequest,
  MemberManagementPanelProps,
  MembersTabProps,
  JoinRequestsTabProps,
  MemberTableRowProps,
  JoinRequestTableRowProps,
  MemberRemovalDialogProps
} from '../../types';

/**
 * Enhanced member management state interface
 */
export interface MemberManagementState {
  members: Member[];
  joinRequests: JoinRequest[];
  filteredMembers: Member[];
  filteredRequests: JoinRequest[];
  searchQuery: string;
  loading: boolean;
  processingAction: boolean;
  memberToRemove: string | null;
  reviewModalOpen: boolean;
  selectedRequest: EnhancedJoinRequest | null;
  activeTab: string;
}

/**
 * Member data processing result
 */
export interface ProcessedMemberData {
  members: Member[];
  joinRequests: JoinRequest[];
}

/**
 * Search and filter options
 */
export interface MemberFilterOptions {
  searchQuery: string;
  activeTab: 'members' | 'requests';
}

/**
 * Member management actions interface
 */
export interface MemberManagementActions {
  onRemoveMember: (memberId: string) => Promise<void>;
  onApproveRequest: (userId: string) => Promise<void>;
  onRejectRequest: (userId: string) => Promise<void>;
  onViewRequest: (request: EnhancedJoinRequest) => void;
  onSearchChange: (query: string) => void;
  onTabChange: (tab: string) => void;
}

/**
 * Props for MemberSearchFilter component
 */
export interface MemberSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Props for MemberManagementTabs component
 */
export interface MemberManagementTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  memberCount: number;
  requestCount: number;
  loading?: boolean;
}

/**
 * Props for MemberActionModals component
 */
export interface MemberActionModalsProps {
  memberToRemove: string | null;
  reviewModalOpen: boolean;
  selectedRequest: EnhancedJoinRequest | null;
  processingAction: boolean;
  onConfirmRemoval: (memberId: string) => Promise<void>;
  onCancelRemoval: () => void;
  onCloseReviewModal: () => void;
  onApproveFromModal: () => Promise<void>;
  onRejectFromModal: () => Promise<void>;
}

// Re-export the base types from the parent types file
export type { Member, JoinRequest, EnhancedJoinRequest } from '../../types';
