/**
 * Book Validation Module
 * 
 * Input validation and business rules for personal books
 */

import {
  validateUserId,
  validatePersonalBookId,
  validateGoogleBooksId,
  validateBookTitle,
  validateBookAuthor,
  validateBookDescription,
  validateBookGenre,
  validatePageCount,
  validateISBN,
  validateOptionalRating,
  ValidationResult,
  validateMultiple
} from '@/lib/api/books/validation';
import { AddBookToLibraryRequest, UpdatePersonalBookRequest, PersonalBooksQueryOptions, InteractionType } from './types/personalBooks';

// =====================================================
// Request Validation Functions
// =====================================================

/**
 * Validate add book to library request
 */
export function validateAddBookRequest(
  userId: string,
  bookData: AddBookToLibraryRequest
): ValidationResult {
  const validations = [
    { result: validateUserId(userId), field: 'userId' },
    { result: validateGoogleBooksId(bookData.google_books_id), field: 'google_books_id' },
    { result: validateBookTitle(bookData.title), field: 'title' },
    { result: validateBookAuthor(bookData.author), field: 'author' }
  ];

  // Optional field validations
  if (bookData.description) {
    validations.push({ result: validateBookDescription(bookData.description), field: 'description' });
  }
  if (bookData.genre) {
    validations.push({ result: validateBookGenre(bookData.genre), field: 'genre' });
  }
  if (bookData.page_count !== undefined) {
    validations.push({ result: validatePageCount(bookData.page_count), field: 'page_count' });
  }
  if (bookData.isbn) {
    validations.push({ result: validateISBN(bookData.isbn), field: 'isbn' });
  }

  return validateMultiple(validations);
}

/**
 * Validate update book request
 */
export function validateUpdateBookRequest(
  userId: string,
  bookId: string,
  updates: UpdatePersonalBookRequest
): ValidationResult {
  const validations = [
    { result: validateUserId(userId), field: 'userId' },
    { result: validatePersonalBookId(bookId), field: 'bookId' }
  ];

  // Only validate provided fields
  if (updates.title !== undefined) {
    validations.push({ result: validateBookTitle(updates.title), field: 'title' });
  }
  if (updates.author !== undefined) {
    validations.push({ result: validateBookAuthor(updates.author), field: 'author' });
  }
  if (updates.description !== undefined) {
    validations.push({ result: validateBookDescription(updates.description), field: 'description' });
  }
  if (updates.genre !== undefined) {
    validations.push({ result: validateBookGenre(updates.genre), field: 'genre' });
  }
  if (updates.page_count !== undefined) {
    validations.push({ result: validatePageCount(updates.page_count), field: 'page_count' });
  }
  if (updates.isbn !== undefined) {
    validations.push({ result: validateISBN(updates.isbn), field: 'isbn' });
  }

  return validateMultiple(validations);
}

/**
 * Validate personal books query options
 */
export function validateQueryOptions(options: PersonalBooksQueryOptions): ValidationResult {
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

  // Validate search query
  if (options.search !== undefined) {
    if (options.search.length > 200) {
      return {
        valid: false,
        error: 'Search query must be less than 200 characters'
      };
    }
  }

  // Validate genre filter
  if (options.genre !== undefined) {
    const genreValidation = validateBookGenre(options.genre);
    if (!genreValidation.valid) {
      return genreValidation;
    }
  }

  // Validate sort options
  if (options.sortBy && !['title', 'author', 'added_at'].includes(options.sortBy)) {
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
 * Validate interaction tracking parameters
 */
export function validateInteractionTracking(
  userId: string,
  googleBooksId: string,
  interactionType: InteractionType,
  interactionValue?: number
): ValidationResult {
  const validations = [
    { result: validateUserId(userId), field: 'userId' },
    { result: validateGoogleBooksId(googleBooksId), field: 'googleBooksId' }
  ];

  // Validate interaction type
  const validInteractionTypes: InteractionType[] = ['added', 'removed', 'rated', 'reviewed', 'completed'];
  if (!validInteractionTypes.includes(interactionType)) {
    return {
      valid: false,
      error: 'Invalid interaction type'
    };
  }

  // Validate interaction value if provided (for ratings)
  if (interactionValue !== undefined && interactionType === 'rated') {
    validations.push({ result: validateOptionalRating(interactionValue), field: 'interactionValue' });
  }

  return validateMultiple(validations);
}

// =====================================================
// Data Cleaning Functions
// =====================================================

/**
 * Clean and normalize book data before storage
 */
export function cleanBookData(bookData: AddBookToLibraryRequest): AddBookToLibraryRequest {
  return {
    ...bookData,
    title: bookData.title.trim(),
    author: bookData.author.trim() || 'Unknown Author',
    cover_url: bookData.cover_url?.trim() || undefined,
    description: bookData.description?.trim() || undefined,
    genre: bookData.genre?.trim() || undefined,
    published_date: bookData.published_date?.trim() || undefined,
    page_count: bookData.page_count && bookData.page_count > 0 ? bookData.page_count : undefined,
    isbn: bookData.isbn?.trim() || undefined
  };
}

/**
 * Clean update data before applying changes
 */
export function cleanUpdateData(updates: UpdatePersonalBookRequest): UpdatePersonalBookRequest {
  const cleaned: UpdatePersonalBookRequest = {};

  if (updates.title !== undefined) {
    cleaned.title = updates.title.trim();
  }
  if (updates.author !== undefined) {
    cleaned.author = updates.author.trim() || 'Unknown Author';
  }
  if (updates.cover_url !== undefined) {
    cleaned.cover_url = updates.cover_url.trim() || undefined;
  }
  if (updates.description !== undefined) {
    cleaned.description = updates.description.trim() || undefined;
  }
  if (updates.genre !== undefined) {
    cleaned.genre = updates.genre.trim() || undefined;
  }
  if (updates.published_date !== undefined) {
    cleaned.published_date = updates.published_date.trim() || undefined;
  }
  if (updates.page_count !== undefined) {
    cleaned.page_count = updates.page_count && updates.page_count > 0 ? updates.page_count : undefined;
  }
  if (updates.isbn !== undefined) {
    cleaned.isbn = updates.isbn.trim() || undefined;
  }

  return cleaned;
}

/**
 * Validate and clean search query
 */
export function validateAndCleanSearchQuery(query: string): ValidationResult & { cleanedQuery?: string } {
  if (!query || typeof query !== 'string') {
    return {
      valid: false,
      error: 'Search query is required'
    };
  }

  const cleanedQuery = query.trim();

  if (cleanedQuery.length === 0) {
    return {
      valid: false,
      error: 'Search query cannot be empty'
    };
  }

  if (cleanedQuery.length > 200) {
    return {
      valid: false,
      error: 'Search query must be less than 200 characters'
    };
  }

  return {
    valid: true,
    cleanedQuery
  };
}

/**
 * Validate ISBN format
 */
export function validateISBNFormat(isbn: string): ValidationResult {
  if (!isbn || typeof isbn !== 'string') {
    return { valid: true }; // ISBN is optional
  }

  const cleanISBN = isbn.replace(/[-\s]/g, ''); // Remove hyphens and spaces

  // Check for ISBN-10 or ISBN-13 format
  const isbn10Regex = /^\d{9}[\dX]$/;
  const isbn13Regex = /^\d{13}$/;

  if (!isbn10Regex.test(cleanISBN) && !isbn13Regex.test(cleanISBN)) {
    return {
      valid: false,
      error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13'
    };
  }

  return { valid: true };
}
