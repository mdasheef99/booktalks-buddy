/**
 * New Conversation Page Types
 * 
 * Type definitions for new conversation components and data structures
 */

import type { MessagingUser } from '@/lib/api/messaging/types';

// Main page props
export interface NewConversationPageProps {
  className?: string;
}

// Form data interface
export interface ConversationFormData {
  username: string;
  selectedUser: MessagingUser | null;
  message: string;
}

// User selection state
export interface UserSelectionState {
  username: string;
  selectedUser: MessagingUser | null;
  isValidating: boolean;
}

// Permission state
export interface ConversationPermissions {
  canInitiate: boolean;
  isLoading: boolean;
  error?: string;
}

// Permission check props
export interface PermissionCheckProps {
  permissions: ConversationPermissions;
  onUpgradeClick?: () => void;
}

// User selection form props
export interface UserSelectionFormProps {
  username: string;
  selectedUser: MessagingUser | null;
  isLoading: boolean;
  canInitiate: boolean;
  onUsernameChange: (value: string) => void;
  onUserSelect: (user: MessagingUser) => void;
  onClearSelection: () => void;
}

// Message composition props
export interface MessageCompositionProps {
  selectedUser: MessagingUser;
  message: string;
  isLoading: boolean;
  canInitiate: boolean;
  canSubmit: boolean;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
}

// Instructions props
export interface ConversationInstructionsProps {
  onBackToMessages: () => void;
}

// Footer props
export interface ConversationFooterProps {
  className?: string;
}

// Loading state props
export interface ConversationLoadingProps {
  isStarting: boolean;
  isValidating: boolean;
}

// Error state props
export interface NewConversationErrorProps {
  onRetry?: () => void;
  onBack?: () => void;
}

// Skeleton props
export interface NewConversationSkeletonProps {
  className?: string;
}

// Form validation result
export interface ConversationValidationResult {
  isValid: boolean;
  errors: {
    username?: string;
    message?: string;
    permissions?: string;
  };
}

// Conversation creation result
export interface ConversationCreationResult {
  conversation_id: string;
  is_existing: boolean;
  recipient_username: string;
}

// Hook return types
export interface UseNewConversationReturn {
  formData: ConversationFormData;
  permissions: ConversationPermissions;
  isLoading: boolean;
  canSubmit: boolean;
  actions: {
    handleUsernameChange: (value: string) => void;
    handleUserSelect: (user: MessagingUser) => void;
    handleMessageChange: (value: string) => void;
    handleClearSelection: () => void;
    handleStartConversation: () => void;
    handleBack: () => void;
  };
}

export interface UseConversationPermissionsReturn {
  canInitiate: boolean;
  isLoading: boolean;
  error?: string;
}
