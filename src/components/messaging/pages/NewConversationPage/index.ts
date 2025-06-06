/**
 * New Conversation Page - Main Export
 * 
 * Aggregates all new conversation components with proper type exports
 */

// =========================
// Type Exports
// =========================
export type {
  NewConversationPageProps,
  ConversationFormData,
  UserSelectionState,
  ConversationPermissions
} from './types';

// =========================
// Component Exports
// =========================
export { NewConversationPage } from './NewConversationPage';
export { PermissionCheck } from './components/PermissionCheck';
export { UserSelectionForm } from './components/UserSelectionForm';
export { MessageComposition } from './components/MessageComposition';
export { ConversationInstructions } from './components/ConversationInstructions';
export { ConversationFooter } from './components/ConversationFooter';
export { NewConversationSkeleton } from './components/NewConversationSkeleton';
export { NewConversationError } from './components/NewConversationError';

// =========================
// Hook Exports
// =========================
export { useNewConversation } from './hooks/useNewConversation';
export { useConversationPermissions } from './hooks/useConversationPermissions';

// =========================
// Utility Exports
// =========================
export { 
  validateConversationForm,
  formatConversationData,
  getConversationValidationErrors
} from './utils/conversationUtils';
