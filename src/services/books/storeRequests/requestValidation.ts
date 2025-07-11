/**
 * Request Validation Module
 * 
 * Input validation and business rules for store requests
 */

import { validateUserId, validateStoreId, ValidationResult } from '@/lib/api/books/validation';
import { CreateStoreRequestRequest, StoreRequestQueryOptions, StoreResponseStatus } from './types/storeRequests';

// =====================================================
// Request Validation Functions
// =====================================================

/**
 * Validate create store request input
 */
export function validateCreateStoreRequest(
  userId: string,
  userEmail: string,
  userName: string,
  request: CreateStoreRequestRequest
): ValidationResult {
  // Validate user ID
  const userIdValidation = validateUserId(userId);
  if (!userIdValidation.valid) {
    return userIdValidation;
  }

  // Validate user email
  if (!userEmail || !userEmail.trim()) {
    return {
      valid: false,
      error: 'User email is required'
    };
  }

  if (!isValidEmail(userEmail)) {
    return {
      valid: false,
      error: 'Invalid email format'
    };
  }

  // Validate user name
  if (!userName || !userName.trim()) {
    return {
      valid: false,
      error: 'User name is required'
    };
  }

  if (userName.trim().length < 2) {
    return {
      valid: false,
      error: 'User name must be at least 2 characters long'
    };
  }

  // Validate book title
  if (!request.book_title || !request.book_title.trim()) {
    return {
      valid: false,
      error: 'Book title is required'
    };
  }

  if (request.book_title.trim().length < 2) {
    return {
      valid: false,
      error: 'Book title must be at least 2 characters long'
    };
  }

  if (request.book_title.trim().length > 200) {
    return {
      valid: false,
      error: 'Book title must be less than 200 characters'
    };
  }

  // Validate book author
  if (!request.book_author || !request.book_author.trim()) {
    return {
      valid: false,
      error: 'Book author is required'
    };
  }

  if (request.book_author.trim().length < 2) {
    return {
      valid: false,
      error: 'Book author must be at least 2 characters long'
    };
  }

  if (request.book_author.trim().length > 100) {
    return {
      valid: false,
      error: 'Book author must be less than 100 characters'
    };
  }

  // Validate description (optional)
  if (request.description && request.description.trim().length > 500) {
    return {
      valid: false,
      error: 'Description must be less than 500 characters'
    };
  }

  // Validate Google Books ID (optional)
  if (request.google_books_id && request.google_books_id.trim().length > 50) {
    return {
      valid: false,
      error: 'Google Books ID is invalid'
    };
  }

  return { valid: true };
}

/**
 * Validate store request query options
 */
export function validateStoreRequestQuery(options: StoreRequestQueryOptions): ValidationResult {
  // Validate status
  if (options.status && !['pending', 'responded', 'resolved'].includes(options.status)) {
    return {
      valid: false,
      error: 'Invalid status filter'
    };
  }

  // Validate request source
  if (options.request_source && !['anonymous', 'authenticated_user'].includes(options.request_source)) {
    return {
      valid: false,
      error: 'Invalid request source filter'
    };
  }

  // Validate limit
  if (options.limit !== undefined) {
    if (options.limit < 1 || options.limit > 100) {
      return {
        valid: false,
        error: 'Limit must be between 1 and 100'
      };
    }
  }

  // Validate offset
  if (options.offset !== undefined && options.offset < 0) {
    return {
      valid: false,
      error: 'Offset must be non-negative'
    };
  }

  // Validate sort options
  if (options.sortBy && !['created_at', 'responded_at', 'status'].includes(options.sortBy)) {
    return {
      valid: false,
      error: 'Invalid sort field'
    };
  }

  if (options.sortOrder && !['asc', 'desc'].includes(options.sortOrder)) {
    return {
      valid: false,
      error: 'Invalid sort order'
    };
  }

  return { valid: true };
}

/**
 * Validate store response status
 */
export function validateStoreResponseStatus(status: string): ValidationResult {
  const validStatuses: StoreResponseStatus[] = ['available', 'unavailable', 'ordered'];

  if (!validStatuses.includes(status as StoreResponseStatus)) {
    return {
      valid: false,
      error: 'Invalid store response status'
    };
  }

  return { valid: true };
}

/**
 * Validate store response text
 */
export function validateStoreResponse(response?: string): ValidationResult {
  if (response && response.trim().length > 500) {
    return {
      valid: false,
      error: 'Store response must be less than 500 characters'
    };
  }

  return { valid: true };
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize text input
 */
export function sanitizeTextInput(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}


