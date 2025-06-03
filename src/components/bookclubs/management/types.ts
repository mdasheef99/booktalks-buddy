/**
 * Shared types for member management components
 */

/**
 * Member data structure
 */
export interface Member {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  user?: {
    username?: string;
    email?: string;
    display_name?: string;
  };
}

/**
 * Join request data structure (legacy)
 */
export interface JoinRequest {
  user_id: string;
  club_id: string;
  requested_at: string;
  status: string;
  user?: {
    username?: string;
    email?: string;
    display_name?: string;
  };
}

/**
 * Enhanced join request with answers support
 */
export interface EnhancedJoinRequest {
  user_id: string;
  username: string;
  display_name: string;
  requested_at: string;
  has_answers: boolean;
  answers: Array<{
    question_id: string;
    question_text: string;
    answer: string;
    is_required: boolean;
  }>;
}

/**
 * Props for the main MemberManagementPanel component
 */
export interface MemberManagementPanelProps {
  clubId: string;
}

/**
 * Props for MembersTab component
 */
export interface MembersTabProps {
  members: Member[];
  loading: boolean;
  processingAction: boolean;
  currentUserId?: string;
  onRemoveMember: (memberId: string) => void;
}

/**
 * Props for JoinRequestsTab component
 */
export interface JoinRequestsTabProps {
  legacyRequests: JoinRequest[];
  enhancedRequests: EnhancedJoinRequest[];
  loading: boolean;
  processingAction: boolean;
  onViewRequest: (request: EnhancedJoinRequest) => void;
  onApproveRequest: (userId: string) => void;
  onRejectRequest: (userId: string) => void;
}

/**
 * Props for MemberTableRow component
 */
export interface MemberTableRowProps {
  member: Member;
  processingAction: boolean;
  currentUserId?: string;
  onRemove: (memberId: string) => void;
}

/**
 * Props for JoinRequestTableRow component
 */
export interface JoinRequestTableRowProps {
  request: EnhancedJoinRequest | JoinRequest;
  type: 'enhanced' | 'legacy';
  processingAction: boolean;
  onView?: (request: EnhancedJoinRequest) => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

/**
 * Props for MemberRemovalDialog component
 */
export interface MemberRemovalDialogProps {
  isOpen: boolean;
  memberToRemove: string | null;
  processingAction: boolean;
  onConfirm: (memberId: string) => void;
  onCancel: () => void;
}

/**
 * Member management state
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
 * Common member management actions
 */
export interface MemberManagementActions {
  onRemoveMember: (memberId: string) => void;
  onApproveRequest: (userId: string) => void;
  onRejectRequest: (userId: string) => void;
  onViewRequest: (request: EnhancedJoinRequest) => void;
  onSearchChange: (query: string) => void;
  onTabChange: (tab: string) => void;
}
