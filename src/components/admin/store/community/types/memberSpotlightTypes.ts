/**
 * Member Spotlight Manager Types
 * Type definitions for the member spotlight management interface
 */

import type { 
  MemberSpotlight, 
  MemberSpotlightFormData, 
  StoreUser,
  SpotlightType 
} from '@/lib/api/store/types/communityShowcaseTypes';

// ===== COMPONENT PROPS =====

export interface MemberSpotlightManagerProps {
  storeId: string;
  spotlights: MemberSpotlight[];
  onRefresh: () => void;
}

export interface MemberSpotlightFormProps {
  formData: MemberSpotlightFormData;
  onFormDataChange: (data: MemberSpotlightFormData) => void;
  isEditing: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  storeId: string;
}

export interface MemberSpotlightListProps {
  spotlights: MemberSpotlight[];
  onEdit: (spotlight: MemberSpotlight) => void;
  onDelete: (spotlightId: string) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

export interface MemberSpotlightItemProps {
  spotlight: MemberSpotlight;
  onEdit: (spotlight: MemberSpotlight) => void;
  onDelete: (spotlightId: string) => void;
}

export interface MemberSpotlightActionsProps {
  spotlight: MemberSpotlight;
  onEdit: (spotlight: MemberSpotlight) => void;
  onDelete: (spotlightId: string) => void;
}

export interface MemberSearchProps {
  storeId: string;
  selectedMemberId: string;
  onMemberSelect: (memberId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export interface MemberSearchResultProps {
  member: StoreUser;
  isSelected: boolean;
  onSelect: (memberId: string) => void;
}

export interface SpotlightTypeSelectProps {
  value: SpotlightType;
  onChange: (type: SpotlightType) => void;
  showDescription?: boolean;
}

export interface SpotlightStatsProps {
  spotlights: MemberSpotlight[];
}

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

// ===== FORM STATE =====

export interface MemberSpotlightFormState {
  formData: MemberSpotlightFormData;
  isEditing: boolean;
  editingSpotlight: MemberSpotlight | null;
  showDialog: boolean;
  errors: MemberSpotlightFormErrors;
}

export interface MemberSpotlightFormErrors {
  featured_member_id?: string;
  spotlight_type?: string;
  spotlight_description?: string;
  spotlight_end_date?: string;
  general?: string;
}

// ===== SEARCH STATE =====

export interface MemberSearchState {
  searchTerm: string;
  members: StoreUser[];
  isLoading: boolean;
  error: string | null;
}

// ===== MUTATION PARAMETERS =====

export interface CreateSpotlightParams {
  storeId: string;
  data: MemberSpotlightFormData;
}

export interface UpdateSpotlightParams {
  storeId: string;
  spotlightId: string;
  data: Partial<MemberSpotlightFormData>;
}

export interface DeleteSpotlightParams {
  storeId: string;
  spotlightId: string;
}

// ===== HOOK RETURN TYPES =====

export interface UseMemberSpotlightFormResult {
  formData: MemberSpotlightFormData;
  errors: MemberSpotlightFormErrors;
  isValid: boolean;
  updateField: <K extends keyof MemberSpotlightFormData>(field: K, value: MemberSpotlightFormData[K]) => void;
  resetForm: () => void;
  setFormData: (data: MemberSpotlightFormData) => void;
  validateForm: () => boolean;
  clearErrors: () => void;
  getSubmissionData: () => MemberSpotlightFormData;
}

export interface UseMemberSpotlightMutationsResult {
  createMutation: any; // Will be properly typed with React Query types
  updateMutation: any;
  deleteMutation: any;
  isLoading: boolean;
}

export interface UseMemberSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  members: StoreUser[];
  isLoading: boolean;
  error: string | null;
  clearSearch: () => void;
}

export interface UseMemberSpotlightManagerResult {
  // Form state
  formState: MemberSpotlightFormState;
  updateFormData: (data: MemberSpotlightFormData) => void;
  resetForm: () => void;
  
  // Dialog state
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  
  // Delete state
  deleteSpotlightId: string | null;
  setDeleteSpotlightId: (id: string | null) => void;
  
  // Search state
  searchState: MemberSearchState;
  updateSearchTerm: (term: string) => void;
  
  // Actions
  handleCreateSpotlight: () => void;
  handleEditSpotlight: (spotlight: MemberSpotlight) => void;
  handleSubmit: () => void;
  handleDeleteConfirm: () => void;
  handleMemberSelect: (memberId: string) => void;
  
  // Mutations
  mutations: UseMemberSpotlightMutationsResult;
}

// ===== UTILITY TYPES =====

export interface SpotlightTypeConfig {
  value: SpotlightType;
  label: string;
  icon: any; // Lucide icon component
  description: string;
  color: string;
}

export interface SpotlightStats {
  total: number;
  active: number;
  expired: number;
  byType: Record<SpotlightType, number>;
}

export interface MemberDisplayInfo {
  id: string;
  username: string;
  displayName: string;
  accountTier: string;
  avatar: string;
  initials: string;
}

// ===== EVENT HANDLERS =====

export type SpotlightEventHandler<T = void> = (spotlight: MemberSpotlight) => T;
export type SpotlightIdEventHandler<T = void> = (spotlightId: string) => T;
export type MemberSelectHandler = (memberId: string) => void;
export type FormFieldChangeHandler<K extends keyof MemberSpotlightFormData> = (
  field: K, 
  value: MemberSpotlightFormData[K]
) => void;

// ===== VALIDATION TYPES =====

export interface ValidationRule<T = any> {
  validate: (value: T, formData?: MemberSpotlightFormData) => string | undefined;
  message: string;
}

export interface FieldValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: ValidationRule[];
}

export type FormValidationConfig = {
  [K in keyof MemberSpotlightFormData]?: FieldValidationConfig;
};

// ===== FILTER AND SORT TYPES =====

export type SpotlightFilterType = 'all' | 'active' | 'expired' | SpotlightType;

export interface SpotlightFilters {
  type: SpotlightFilterType;
  member: string | null;
  dateRange: {
    start?: string;
    end?: string;
  } | null;
}

export type SpotlightSortField = 'created_at' | 'spotlight_start_date' | 'spotlight_end_date' | 'spotlight_type';
export type SortDirection = 'asc' | 'desc';

export interface SpotlightSort {
  field: SpotlightSortField;
  direction: SortDirection;
}
