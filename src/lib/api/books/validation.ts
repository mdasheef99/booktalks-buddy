/**
 * Books Section Input Validation Module
 * 
 * Comprehensive validation functions for Books Section services
 * Following established BookTalks Buddy validation patterns
 */

import * as Sentry from "@sentry/react";

// =====================================================
// Validation Interfaces
// =====================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, any>;
}

export interface BooksValidationError extends Error {
  field?: string;
  code?: string;
  details?: Record<string, any>;
}

// =====================================================
// Validation Constants
// =====================================================

/**
 * Valid reading status values
 */
export const VALID_READING_STATUS = ['want_to_read', 'currently_reading', 'completed'] as const;

/**
 * Rating bounds
 */
export const RATING_MIN = 1;
export const RATING_MAX = 5;

/**
 * Text field length limits (matching database constraints)
 */
export const TEXT_LIMITS = {
  BOOK_TITLE: { min: 1, max: 500 },
  BOOK_AUTHOR: { min: 1, max: 300 },
  BOOK_DESCRIPTION: { max: 2000 },
  BOOK_GENRE: { max: 100 },
  REVIEW_TEXT: { max: 2000 },
  COLLECTION_NAME: { min: 1, max: 100 },
  COLLECTION_DESCRIPTION: { max: 500 },
  COLLECTION_NOTES: { max: 500 },
  STORE_REQUEST_NOTES: { max: 1000 }
} as const;

/**
 * UUID regex pattern for validation
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Google Books ID pattern (alphanumeric, typically 12 characters)
 */
const GOOGLE_BOOKS_ID_REGEX = /^[a-zA-Z0-9_-]{10,20}$/;

/**
 * ISBN pattern (basic validation)
 */
const ISBN_REGEX = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;

// =====================================================
// Core Validation Functions
// =====================================================

/**
 * Validate user ID format (UUID)
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

  if (!UUID_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid user ID format',
      details: { format: 'Expected UUID format' }
    };
  }

  return { valid: true };
}

/**
 * Validate personal book ID (UUID)
 */
export function validatePersonalBookId(bookId: string): ValidationResult {
  if (!bookId || typeof bookId !== 'string') {
    return {
      valid: false,
      error: 'Book ID is required',
      details: { provided: typeof bookId }
    };
  }

  const trimmed = bookId.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Book ID cannot be empty'
    };
  }

  if (!UUID_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid book ID format',
      details: { format: 'Expected UUID format' }
    };
  }

  return { valid: true };
}

/**
 * Validate Google Books ID
 */
export function validateGoogleBooksId(googleBooksId: string): ValidationResult {
  if (!googleBooksId || typeof googleBooksId !== 'string') {
    return {
      valid: false,
      error: 'Google Books ID is required',
      details: { provided: typeof googleBooksId }
    };
  }

  const trimmed = googleBooksId.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Google Books ID cannot be empty'
    };
  }

  if (!GOOGLE_BOOKS_ID_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid Google Books ID format',
      details: { format: 'Expected alphanumeric string 10-20 characters' }
    };
  }

  return { valid: true };
}

/**
 * Validate collection ID (UUID)
 */
export function validateCollectionId(collectionId: string): ValidationResult {
  if (!collectionId || typeof collectionId !== 'string') {
    return {
      valid: false,
      error: 'Collection ID is required',
      details: { provided: typeof collectionId }
    };
  }

  const trimmed = collectionId.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Collection ID cannot be empty'
    };
  }

  if (!UUID_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid collection ID format',
      details: { format: 'Expected UUID format' }
    };
  }

  return { valid: true };
}

/**
 * Validate reading status enum
 */
export function validateReadingStatus(status: string): ValidationResult {
  if (!status || typeof status !== 'string') {
    return {
      valid: false,
      error: 'Reading status is required',
      details: { provided: typeof status }
    };
  }

  const trimmed = status.trim();
  if (!VALID_READING_STATUS.includes(trimmed as any)) {
    return {
      valid: false,
      error: 'Invalid reading status',
      details: { 
        provided: trimmed,
        valid: VALID_READING_STATUS 
      }
    };
  }

  return { valid: true };
}

/**
 * Validate rating value (1-5 range)
 */
export function validateRating(rating: number): ValidationResult {
  if (rating === null || rating === undefined) {
    return {
      valid: false,
      error: 'Rating is required',
      details: { provided: rating }
    };
  }

  if (typeof rating !== 'number' || isNaN(rating)) {
    return {
      valid: false,
      error: 'Rating must be a number',
      details: { provided: typeof rating }
    };
  }

  if (!Number.isInteger(rating)) {
    return {
      valid: false,
      error: 'Rating must be a whole number',
      details: { provided: rating }
    };
  }

  if (rating < RATING_MIN || rating > RATING_MAX) {
    return {
      valid: false,
      error: `Rating must be between ${RATING_MIN} and ${RATING_MAX}`,
      details: { 
        provided: rating,
        min: RATING_MIN,
        max: RATING_MAX 
      }
    };
  }

  return { valid: true };
}

/**
 * Validate optional rating (allows null/undefined)
 */
export function validateOptionalRating(rating?: number | null): ValidationResult {
  if (rating === null || rating === undefined) {
    return { valid: true };
  }

  return validateRating(rating);
}

// =====================================================
// Text Field Validation Functions
// =====================================================

/**
 * Generic text field validation
 */
function validateTextField(
  value: string | null | undefined,
  fieldName: string,
  limits: { min?: number; max: number },
  required: boolean = true
): ValidationResult {
  if (!value || typeof value !== 'string') {
    if (required) {
      return {
        valid: false,
        error: `${fieldName} is required`,
        details: { provided: typeof value }
      };
    }
    return { valid: true };
  }

  const trimmed = value.trim();
  
  if (required && trimmed.length === 0) {
    return {
      valid: false,
      error: `${fieldName} cannot be empty`
    };
  }

  if (limits.min && trimmed.length < limits.min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${limits.min} characters`,
      details: { 
        provided: trimmed.length,
        min: limits.min 
      }
    };
  }

  if (trimmed.length > limits.max) {
    return {
      valid: false,
      error: `${fieldName} must be less than ${limits.max} characters`,
      details: { 
        provided: trimmed.length,
        max: limits.max 
      }
    };
  }

  return { valid: true };
}

/**
 * Validate book title
 */
export function validateBookTitle(title: string): ValidationResult {
  return validateTextField(title, 'Book title', TEXT_LIMITS.BOOK_TITLE, true);
}

/**
 * Validate book author
 */
export function validateBookAuthor(author: string): ValidationResult {
  return validateTextField(author, 'Book author', TEXT_LIMITS.BOOK_AUTHOR, true);
}

/**
 * Validate book description (optional)
 */
export function validateBookDescription(description?: string | null): ValidationResult {
  return validateTextField(description, 'Book description', TEXT_LIMITS.BOOK_DESCRIPTION, false);
}

/**
 * Validate book genre (optional)
 */
export function validateBookGenre(genre?: string | null): ValidationResult {
  return validateTextField(genre, 'Book genre', TEXT_LIMITS.BOOK_GENRE, false);
}

/**
 * Validate review text (optional)
 */
export function validateReviewText(reviewText?: string | null): ValidationResult {
  return validateTextField(reviewText, 'Review text', TEXT_LIMITS.REVIEW_TEXT, false);
}

/**
 * Validate collection name
 */
export function validateCollectionName(name: string): ValidationResult {
  return validateTextField(name, 'Collection name', TEXT_LIMITS.COLLECTION_NAME, true);
}

/**
 * Validate collection description (optional)
 */
export function validateCollectionDescription(description?: string | null): ValidationResult {
  return validateTextField(description, 'Collection description', TEXT_LIMITS.COLLECTION_DESCRIPTION, false);
}

/**
 * Validate collection notes (optional)
 */
export function validateCollectionNotes(notes?: string | null): ValidationResult {
  return validateTextField(notes, 'Collection notes', TEXT_LIMITS.COLLECTION_NOTES, false);
}

/**
 * Validate store request additional notes (optional)
 */
export function validateStoreRequestNotes(notes?: string | null): ValidationResult {
  return validateTextField(notes, 'Additional notes', TEXT_LIMITS.STORE_REQUEST_NOTES, false);
}

// =====================================================
// Additional Validation Functions
// =====================================================

/**
 * Validate ISBN (optional)
 */
export function validateISBN(isbn?: string | null): ValidationResult {
  if (!isbn || typeof isbn !== 'string') {
    return { valid: true }; // ISBN is optional
  }

  const trimmed = isbn.trim();
  if (trimmed.length === 0) {
    return { valid: true }; // Empty is valid for optional field
  }

  // Remove hyphens and spaces for validation
  const cleanISBN = trimmed.replace(/[-\s]/g, '');
  
  if (!ISBN_REGEX.test(cleanISBN)) {
    return {
      valid: false,
      error: 'Invalid ISBN format',
      details: { provided: isbn }
    };
  }

  return { valid: true };
}

/**
 * Validate page count (optional)
 * Handles Google Books API data which may have undefined, null, 0, or string values
 */
export function validatePageCount(pageCount?: number | string | null): ValidationResult {
  // Allow null/undefined for optional field
  if (pageCount === null || pageCount === undefined) {
    return { valid: true };
  }

  // Convert string numbers to integers (Google Books API sometimes returns strings)
  let numericPageCount: number;
  if (typeof pageCount === 'string') {
    const parsed = parseInt(pageCount, 10);
    if (isNaN(parsed)) {
      return { valid: true }; // Treat invalid strings as optional (null)
    }
    numericPageCount = parsed;
  } else if (typeof pageCount === 'number') {
    numericPageCount = pageCount;
  } else {
    return { valid: true }; // Treat other types as optional (null)
  }

  // Allow 0 or negative values from API (treat as null)
  if (numericPageCount <= 0) {
    return { valid: true };
  }

  // Validate reasonable upper limit
  if (numericPageCount > 50000) {
    return {
      valid: false,
      error: 'Page count seems unreasonably high',
      details: { provided: numericPageCount, max: 50000 }
    };
  }

  return { valid: true };
}

/**
 * Validate boolean privacy setting
 */
export function validatePrivacySetting(isPublic?: boolean | null): ValidationResult {
  if (isPublic === null || isPublic === undefined) {
    return { valid: true }; // Optional field, will use default
  }

  if (typeof isPublic !== 'boolean') {
    return {
      valid: false,
      error: 'Privacy setting must be a boolean',
      details: { provided: typeof isPublic }
    };
  }

  return { valid: true };
}

// =====================================================
// Error Handling Utilities
// =====================================================

/**
 * Create a standardized validation error
 */
export function createValidationError(
  message: string,
  field?: string,
  details?: Record<string, any>
): BooksValidationError {
  const error = new Error(message) as BooksValidationError;
  error.name = 'BooksValidationError';
  error.field = field;
  error.code = 'VALIDATION_ERROR';
  error.details = details;
  return error;
}

/**
 * Throw validation error if result is invalid
 */
export function throwIfInvalid(result: ValidationResult, field?: string): void {
  if (!result.valid) {
    const error = createValidationError(
      result.error || 'Validation failed',
      field,
      result.details
    );
    
    // Log validation error to Sentry
    Sentry.captureException(error, {
      tags: {
        source: "booksValidation",
        field: field || 'unknown'
      },
      extra: result.details
    });
    
    throw error;
  }
}

/**
 * Validate multiple fields and collect all errors
 */
export function validateMultiple(validations: Array<{
  result: ValidationResult;
  field: string;
}>): ValidationResult {
  const errors: string[] = [];
  const details: Record<string, any> = {};

  for (const { result, field } of validations) {
    if (!result.valid) {
      errors.push(`${field}: ${result.error}`);
      if (result.details) {
        details[field] = result.details;
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('; '),
      details
    };
  }

  return { valid: true };
}
