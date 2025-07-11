/**
 * MemberManagementPanel Module Export Aggregator
 * Maintains 100% backward compatibility with existing imports
 */

// Main component export (backward compatibility)
export { default } from './MemberManagementPanel';
export { default as MemberManagementPanel } from './MemberManagementPanel';

// Component exports (new modular components)
export { MemberSearchFilter } from './components/MemberSearchFilter';
export { MemberManagementTabs } from './components/MemberManagementTabs';
export { MemberActionModals } from './components/MemberActionModals';

// Hook exports (new modular hooks)
export { useMemberData } from './hooks/useMemberData';
export { useMemberFiltering } from './hooks/useMemberFiltering';
export { useMemberManagement } from './hooks/useMemberManagement';
export { useJoinRequestManagement } from './hooks/useJoinRequestManagement';

// Utility exports
export * from './utils/memberDataProcessing';

// Type exports (maintain existing imports)
export type * from './types/memberManagement';

// Re-export existing types from parent for backward compatibility
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
} from '../types';
