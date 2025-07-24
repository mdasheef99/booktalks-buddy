/**
 * Store Manager Type Definitions
 * 
 * TypeScript interfaces and types for Store Manager appointment functionality
 */

// =========================
// Core Store Manager Types
// =========================

export interface StoreManager {
  user_id: string;
  store_id: string;
  role: 'manager';
  assigned_at: string;
  assigned_by: string | null;
  users: {
    username: string;
    email: string;
    displayname?: string;
    avatar_thumbnail_url?: string;
  };
}

export interface StoreManagerCandidate {
  id: string;
  username: string;
  email: string;
  displayname?: string;
  avatar_thumbnail_url?: string;
  membership_tier: string;
  created_at: string;
}

// =========================
// API Operation Types
// =========================

export interface AppointStoreManagerRequest {
  storeId: string;
  userId: string;
}

export interface RemoveStoreManagerRequest {
  storeId: string;
  userId: string;
}

export interface StoreManagerSearchParams {
  storeId: string;
  searchTerm?: string;
  limit?: number;
}

// =========================
// Component Props Types
// =========================

export interface StoreManagersListProps {
  storeId: string;
  managers: StoreManager[];
  loading: boolean;
  onRemoveManager: (userId: string) => void;
  onRefresh: () => void;
}

export interface UserSearchInterfaceProps {
  storeId: string;
  onUserSelect: (user: StoreManagerCandidate) => void;
  excludeUserIds?: string[];
  loading?: boolean;
}

export interface AppointManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: StoreManagerCandidate | null;
  loading: boolean;
}

export interface RemoveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  manager: StoreManager | null;
  loading: boolean;
}

export interface ManagerPermissionsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

// =========================
// Service Layer Types
// =========================

export interface StoreManagerService {
  getStoreManagers(storeId: string): Promise<StoreManager[]>;
  appointStoreManager(storeId: string, userId: string): Promise<void>;
  removeStoreManager(storeId: string, userId: string): Promise<void>;
  searchUsersForAppointment(storeId: string, searchTerm?: string): Promise<StoreManagerCandidate[]>;
}

// =========================
// Hook Return Types
// =========================

export interface UseStoreManagersResult {
  managers: StoreManager[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  appointManager: (userId: string) => Promise<void>;
  removeManager: (userId: string) => Promise<void>;
  appointing: boolean;
  removing: boolean;
}

export interface UseUserSearchResult {
  candidates: StoreManagerCandidate[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refetch: () => Promise<void>;
}

// =========================
// Error Types
// =========================

export interface StoreManagerError {
  code: string;
  message: string;
  details?: any;
}

export type StoreManagerErrorCode = 
  | 'UNAUTHORIZED'
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_MANAGER'
  | 'USER_NOT_IN_STORE'
  | 'STORE_NOT_FOUND'
  | 'APPOINTMENT_FAILED'
  | 'REMOVAL_FAILED'
  | 'SEARCH_FAILED';

// =========================
// API Response Types
// =========================

export interface StoreManagerApiResponse<T = any> {
  data?: T;
  error?: StoreManagerError;
  success: boolean;
}

export interface StoreManagerListResponse extends StoreManagerApiResponse<StoreManager[]> {}
export interface StoreManagerCandidatesResponse extends StoreManagerApiResponse<StoreManagerCandidate[]> {}

// =========================
// Form Types
// =========================

export interface StoreManagerSearchForm {
  searchTerm: string;
}

export interface StoreManagerAppointmentForm {
  userId: string;
  confirmAppointment: boolean;
}

// =========================
// Permission Types
// =========================

export interface StoreManagerPermission {
  key: string;
  name: string;
  description: string;
  category: 'user_management' | 'club_management' | 'content_moderation' | 'analytics' | 'events';
}

export const STORE_MANAGER_PERMISSIONS: StoreManagerPermission[] = [
  {
    key: 'CAN_VIEW_ALL_MEMBERS',
    name: 'View All Members',
    description: 'Access to view all store members and their profiles',
    category: 'user_management'
  },
  {
    key: 'CAN_INVITE_USERS',
    name: 'Invite Users',
    description: 'Ability to invite new users to join the store',
    category: 'user_management'
  },
  {
    key: 'CAN_ISSUE_WARNINGS',
    name: 'Issue Warnings',
    description: 'Authority to issue warnings to members for policy violations',
    category: 'user_management'
  },
  {
    key: 'CAN_BAN_MEMBERS',
    name: 'Ban Members',
    description: 'Authority to ban members from the store',
    category: 'user_management'
  },
  {
    key: 'CAN_UNBAN_MEMBERS',
    name: 'Unban Members',
    description: 'Authority to remove bans and restore member access',
    category: 'user_management'
  },
  {
    key: 'CAN_VIEW_ALL_CLUBS',
    name: 'View All Clubs',
    description: 'Access to view all book clubs within the store',
    category: 'club_management'
  },
  {
    key: 'CAN_MODERATE_CONTENT',
    name: 'Moderate Content',
    description: 'Authority to moderate discussions, posts, and user-generated content',
    category: 'content_moderation'
  },
  {
    key: 'CAN_MANAGE_EVENTS',
    name: 'Manage Events',
    description: 'Ability to create, edit, and manage store events',
    category: 'events'
  },
  {
    key: 'CAN_POST_ANNOUNCEMENTS',
    name: 'Post Announcements',
    description: 'Authority to create and publish store-wide announcements',
    category: 'content_moderation'
  },
  {
    key: 'CAN_MANAGE_ALL_CLUBS',
    name: 'Manage All Clubs',
    description: 'Administrative access to all book clubs in the store',
    category: 'club_management'
  },
  {
    key: 'CAN_VIEW_STORE_ANALYTICS',
    name: 'View Store Analytics',
    description: 'Access to store performance metrics and analytics',
    category: 'analytics'
  },
  {
    key: 'CAN_ASSIGN_CLUB_LEADS',
    name: 'Assign Club Leads',
    description: 'Authority to appoint and manage club leadership roles',
    category: 'club_management'
  }
];
