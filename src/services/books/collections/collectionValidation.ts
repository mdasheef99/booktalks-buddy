/**
 * Collection Validation Module
 * 
 * Handles input validation and business rules for collections
 */

import {
  validateUserId,
  validatePersonalBookId,
  validateCollectionId,
  validateCollectionName,
  validateCollectionDescription,
  validateCollectionNotes,
  validatePrivacySetting,
  throwIfInvalid,
  validateMultiple,
  ValidationResult
} from '@/lib/api/books/validation';

// =====================================================
// Validation Functions
// =====================================================

/**
 * Validate create collection request
 */
export function validateCreateCollectionRequest(
  userId: string,
  request: {
    name: string;
    description?: string;
    is_public?: boolean;
  }
): ValidationResult {
  const validationResult = validateMultiple([
    { result: validateUserId(userId), field: 'userId' },
    { result: validateCollectionName(request.name), field: 'name' },
    { result: validateCollectionDescription(request.description), field: 'description' },
    { result: validatePrivacySetting(request.is_public), field: 'is_public' }
  ]);

  return validationResult;
}

/**
 * Validate update collection request
 */
export function validateUpdateCollectionRequest(
  userId: string,
  collectionId: string,
  updates: {
    name?: string;
    description?: string;
    is_public?: boolean;
  }
): ValidationResult {
  const validations = [
    { result: validateUserId(userId), field: 'userId' },
    { result: validateCollectionId(collectionId), field: 'collectionId' }
  ];

  // Validate update fields if provided
  if (updates.name !== undefined) {
    validations.push({ result: validateCollectionName(updates.name), field: 'name' });
  }
  if (updates.description !== undefined) {
    validations.push({ result: validateCollectionDescription(updates.description), field: 'description' });
  }
  if (updates.is_public !== undefined) {
    validations.push({ result: validatePrivacySetting(updates.is_public), field: 'is_public' });
  }

  return validateMultiple(validations);
}

/**
 * Validate add book to collection request
 */
export function validateAddBookToCollectionRequest(
  userId: string,
  collectionId: string,
  request: {
    book_id: string;
    notes?: string;
  }
): ValidationResult {
  const validationResult = validateMultiple([
    { result: validateUserId(userId), field: 'userId' },
    { result: validateCollectionId(collectionId), field: 'collectionId' },
    { result: validatePersonalBookId(request.book_id), field: 'book_id' },
    { result: validateCollectionNotes(request.notes), field: 'notes' }
  ]);

  return validationResult;
}

/**
 * Validate collection access parameters
 */
export function validateCollectionAccess(
  userId: string,
  collectionId: string
): ValidationResult {
  const validationResult = validateMultiple([
    { result: validateUserId(userId), field: 'userId' },
    { result: validateCollectionId(collectionId), field: 'collectionId' }
  ]);

  return validationResult;
}

/**
 * Validate collection query options
 */
export function validateCollectionQueryOptions(
  options: {
    includePrivate?: boolean;
    includeBookCount?: boolean;
    includePreviewCovers?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }
): ValidationResult {
  // Basic validation for query options
  if (options.limit !== undefined && (options.limit < 0 || options.limit > 100)) {
    return {
      valid: false,
      error: 'Limit must be between 0 and 100'
    };
  }

  if (options.offset !== undefined && options.offset < 0) {
    return {
      valid: false,
      error: 'Offset must be non-negative'
    };
  }

  const validSortFields = ['name', 'created_at', 'updated_at', 'book_count'];
  if (options.sortBy && !validSortFields.includes(options.sortBy)) {
    return {
      valid: false,
      error: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`
    };
  }

  const validSortOrders = ['asc', 'desc'];
  if (options.sortOrder && !validSortOrders.includes(options.sortOrder)) {
    return {
      valid: false,
      error: `Invalid sort order. Must be one of: ${validSortOrders.join(', ')}`
    };
  }

  return { valid: true };
}
