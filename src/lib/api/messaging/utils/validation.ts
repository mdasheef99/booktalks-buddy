/**
 * Validation Module
 * 
 * Handles input validation and content validation for messaging
 */

import type { ValidationResult } from '../types';

/**
 * Validate message content
 * Ensures content meets requirements and is safe
 */
export function validateMessageContent(content: string): ValidationResult {
  if (!content || typeof content !== 'string') {
    return {
      valid: false,
      error: 'Message content is required',
      details: { provided: typeof content }
    };
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Message cannot be empty',
      details: { length: trimmed.length }
    };
  }

  if (trimmed.length > 1000) {
    return {
      valid: false,
      error: 'Message too long (maximum 1000 characters)',
      details: { length: trimmed.length, max: 1000 }
    };
  }

  // Basic content validation (can be extended)
  if (trimmed.includes('<script>') || trimmed.includes('javascript:')) {
    return {
      valid: false,
      error: 'Message contains invalid content',
      details: { reason: 'potential_script_injection' }
    };
  }

  return { valid: true };
}

/**
 * Validate username format
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return {
      valid: false,
      error: 'Username is required',
      details: { provided: typeof username }
    };
  }

  const trimmed = username.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Username cannot be empty'
    };
  }

  // Basic username validation (adjust based on your requirements)
  if (trimmed.length < 3 || trimmed.length > 50) {
    return {
      valid: false,
      error: 'Username must be between 3 and 50 characters',
      details: { length: trimmed.length }
    };
  }

  return { valid: true };
}

/**
 * Validate user ID format
 */
export function validateUserId(userId: string): ValidationResult {
  if (!userId || typeof userId !== 'string') {
    return {
      valid: false,
      error: 'User ID is required',
      details: { provided: typeof userId }
    };
  }

  const trimmed = userId.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'User ID cannot be empty'
    };
  }

  // Basic UUID validation (adjust based on your requirements)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid user ID format',
      details: { format: 'Expected UUID format' }
    };
  }

  return { valid: true };
}

/**
 * Validate conversation ID format
 */
export function validateConversationId(conversationId: string): ValidationResult {
  if (!conversationId || typeof conversationId !== 'string') {
    return {
      valid: false,
      error: 'Conversation ID is required',
      details: { provided: typeof conversationId }
    };
  }

  const trimmed = conversationId.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Conversation ID cannot be empty'
    };
  }

  // Basic UUID validation (adjust based on your requirements)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid conversation ID format',
      details: { format: 'Expected UUID format' }
    };
  }

  return { valid: true };
}

/**
 * Validate store ID format
 */
export function validateStoreId(storeId: string): ValidationResult {
  if (!storeId || typeof storeId !== 'string') {
    return {
      valid: false,
      error: 'Store ID is required',
      details: { provided: typeof storeId }
    };
  }

  const trimmed = storeId.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Store ID cannot be empty'
    };
  }

  // Basic UUID validation (adjust based on your requirements)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid store ID format',
      details: { format: 'Expected UUID format' }
    };
  }

  return { valid: true };
}
