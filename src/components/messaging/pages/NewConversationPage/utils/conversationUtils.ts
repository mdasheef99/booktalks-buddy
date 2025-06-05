/**
 * Conversation Utilities
 * 
 * Utility functions for conversation validation and data processing
 */

import type { 
  ConversationFormData, 
  ConversationValidationResult,
  ConversationPermissions 
} from '../types';

/**
 * Validate conversation form data
 */
export function validateConversationForm(
  formData: ConversationFormData,
  permissions: ConversationPermissions
): ConversationValidationResult {
  const errors: ConversationValidationResult['errors'] = {};

  // Username validation
  if (!formData.username.trim()) {
    errors.username = 'Please select a user';
  } else if (formData.username.trim().length < 2) {
    errors.username = 'Username must be at least 2 characters';
  }

  // Message validation
  if (!formData.message.trim()) {
    errors.message = 'Please enter a message';
  } else if (formData.message.trim().length < 1) {
    errors.message = 'Message cannot be empty';
  } else if (formData.message.length > 1000) {
    errors.message = 'Message must be less than 1000 characters';
  }

  // Permission validation
  if (!permissions.canInitiate) {
    errors.permissions = 'You need to upgrade to start conversations';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Format conversation data for submission
 */
export function formatConversationData(formData: ConversationFormData) {
  return {
    recipientUsername: formData.username.trim(),
    initialMessage: formData.message.trim(),
    selectedUser: formData.selectedUser
  };
}

/**
 * Get validation errors as an array of strings
 */
export function getConversationValidationErrors(
  formData: ConversationFormData,
  permissions: ConversationPermissions
): string[] {
  const validation = validateConversationForm(formData, permissions);
  return Object.values(validation.errors).filter(Boolean);
}

/**
 * Check if form is ready for submission
 */
export function isFormReadyForSubmission(
  formData: ConversationFormData,
  permissions: ConversationPermissions,
  isLoading: boolean
): boolean {
  const validation = validateConversationForm(formData, permissions);
  return validation.isValid && !isLoading;
}

/**
 * Generate conversation navigation URL
 */
export function generateConversationUrl(
  conversationId: string,
  initialMessage?: string
): string {
  const baseUrl = `/messages/${conversationId}`;
  
  if (initialMessage?.trim()) {
    return `${baseUrl}?initialMessage=${encodeURIComponent(initialMessage.trim())}`;
  }
  
  return baseUrl;
}

/**
 * Sanitize message content
 */
export function sanitizeMessage(message: string): string {
  return message
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 1000); // Ensure max length
}

/**
 * Validate username format
 */
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = username.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Username must be at least 2 characters' };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Username must be less than 50 characters' };
  }
  
  // Basic username format validation (alphanumeric, underscore, hyphen)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { isValid: true };
}

/**
 * Get character count display
 */
export function getCharacterCountDisplay(
  current: number,
  max: number
): {
  text: string;
  isNearLimit: boolean;
  isOverLimit: boolean;
} {
  const isNearLimit = current > max * 0.8;
  const isOverLimit = current > max;
  
  return {
    text: `${current}/${max} characters`,
    isNearLimit,
    isOverLimit
  };
}

/**
 * Get permission upgrade message
 */
export function getPermissionUpgradeMessage(canInitiate: boolean): string | null {
  if (canInitiate) return null;
  
  return 'Only Privileged and Privileged+ members can start new conversations. You can still reply to messages sent to you.';
}

/**
 * Format user display name
 */
export function formatUserDisplayName(username: string, displayname?: string): {
  primary: string;
  secondary?: string;
} {
  if (displayname && displayname !== username) {
    return {
      primary: `@${username}`,
      secondary: displayname
    };
  }
  
  return {
    primary: `@${username}`
  };
}
