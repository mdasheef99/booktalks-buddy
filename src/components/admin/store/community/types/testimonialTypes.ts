/**
 * Testimonial Manager Types
 * Type definitions for the testimonial management interface
 */

import type { 
  Testimonial, 
  TestimonialFormData, 
  TestimonialApprovalStatus 
} from '@/lib/api/store/types/communityShowcaseTypes';

// ===== COMPONENT PROPS =====

export interface TestimonialManagerProps {
  storeId: string;
  testimonials: Testimonial[];
  onRefresh: () => void;
}

export interface TestimonialFormProps {
  formData: TestimonialFormData;
  onFormDataChange: (data: TestimonialFormData) => void;
  isEditing: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface TestimonialListProps {
  testimonials: Testimonial[];
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (testimonialId: string) => void;
  onApprovalChange: (testimonialId: string, status: TestimonialApprovalStatus) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

export interface TestimonialItemProps {
  testimonial: Testimonial;
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (testimonialId: string) => void;
  onApprovalChange: (testimonialId: string, status: TestimonialApprovalStatus) => void;
}

export interface TestimonialActionsProps {
  testimonial: Testimonial;
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (testimonialId: string) => void;
  onApprovalChange: (testimonialId: string, status: TestimonialApprovalStatus) => void;
}

export interface TestimonialStatsProps {
  testimonials: Testimonial[];
}

export interface StarRatingProps {
  rating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

// ===== FORM STATE =====

export interface TestimonialFormState {
  formData: TestimonialFormData;
  isEditing: boolean;
  editingTestimonial: Testimonial | null;
  showDialog: boolean;
  errors: TestimonialFormErrors;
}

export interface TestimonialFormErrors {
  customer_name?: string;
  testimonial_text?: string;
  rating?: string;
  source_url?: string;
  general?: string;
}

// ===== MUTATION PARAMETERS =====

export interface CreateTestimonialParams {
  storeId: string;
  data: TestimonialFormData;
}

export interface UpdateTestimonialParams {
  storeId: string;
  testimonialId: string;
  data: Partial<TestimonialFormData>;
}

export interface DeleteTestimonialParams {
  storeId: string;
  testimonialId: string;
}

export interface UpdateApprovalParams {
  storeId: string;
  testimonialId: string;
  status: TestimonialApprovalStatus;
}

// ===== HOOK RETURN TYPES =====

export interface UseTestimonialFormResult {
  formData: TestimonialFormData;
  errors: TestimonialFormErrors;
  isValid: boolean;
  updateField: <K extends keyof TestimonialFormData>(field: K, value: TestimonialFormData[K]) => void;
  resetForm: () => void;
  setFormData: (data: TestimonialFormData) => void;
  validateForm: () => boolean;
  clearErrors: () => void;
}

export interface UseTestimonialMutationsResult {
  createMutation: any; // Will be properly typed with React Query types
  updateMutation: any;
  deleteMutation: any;
  approvalMutation: any;
  isLoading: boolean;
}

export interface UseTestimonialManagerResult {
  // Form state
  formState: TestimonialFormState;
  updateFormData: (data: TestimonialFormData) => void;
  resetForm: () => void;
  
  // Dialog state
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  
  // Delete state
  deleteTestimonialId: string | null;
  setDeleteTestimonialId: (id: string | null) => void;
  
  // Actions
  handleCreateTestimonial: () => void;
  handleEditTestimonial: (testimonial: Testimonial) => void;
  handleSubmit: () => void;
  handleDeleteConfirm: () => void;
  handleApprovalChange: (testimonialId: string, status: TestimonialApprovalStatus) => void;
  
  // Mutations
  mutations: UseTestimonialMutationsResult;
}

// ===== UTILITY TYPES =====

export type TestimonialFilterType = 'all' | 'approved' | 'pending' | 'rejected';

export interface TestimonialFilters {
  status: TestimonialFilterType;
  featured: boolean | null;
  sourceType: string | null;
}

export interface TestimonialStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  featured: number;
}

// ===== EVENT HANDLERS =====

export type TestimonialEventHandler<T = void> = (testimonial: Testimonial) => T;
export type TestimonialIdEventHandler<T = void> = (testimonialId: string) => T;
export type ApprovalEventHandler = (testimonialId: string, status: TestimonialApprovalStatus) => void;
export type FormFieldChangeHandler<K extends keyof TestimonialFormData> = (
  field: K, 
  value: TestimonialFormData[K]
) => void;
