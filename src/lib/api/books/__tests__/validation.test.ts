/**
 * Books Section Validation Tests
 * 
 * Comprehensive test suite for Books Section validation functions
 * Following established BookTalks Buddy testing patterns
 */

import { describe, it, expect } from 'vitest';
import {
  validateUserId,
  validatePersonalBookId,
  validateGoogleBooksId,
  validateCollectionId,
  validateReadingStatus,
  validateRating,
  validateOptionalRating,
  validateBookTitle,
  validateBookAuthor,
  validateBookDescription,
  validateBookGenre,
  validateReviewText,
  validateCollectionName,
  validateCollectionDescription,
  validateCollectionNotes,
  validateStoreRequestNotes,
  validateISBN,
  validatePageCount,
  validatePrivacySetting,
  createValidationError,
  throwIfInvalid,
  validateMultiple,
  VALID_READING_STATUS,
  RATING_MIN,
  RATING_MAX,
  TEXT_LIMITS
} from '../validation';

describe('Books Section Validation', () => {
  
  // =====================================================
  // ID Validation Tests
  // =====================================================
  
  describe('validateUserId', () => {
    it('should accept valid UUID', () => {
      const result = validateUserId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const result = validateUserId('invalid-uuid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid user ID format');
    });

    it('should reject empty string', () => {
      const result = validateUserId('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('User ID is required');
    });

    it('should reject null/undefined', () => {
      const result = validateUserId(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('is required');
    });
  });

  describe('validatePersonalBookId', () => {
    it('should accept valid UUID', () => {
      const result = validatePersonalBookId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = validatePersonalBookId('not-a-uuid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid book ID format');
    });
  });

  describe('validateGoogleBooksId', () => {
    it('should accept valid Google Books ID', () => {
      const result = validateGoogleBooksId('dGstEAAAQBAJ');
      expect(result.valid).toBe(true);
    });

    it('should accept alphanumeric with dashes and underscores', () => {
      const result = validateGoogleBooksId('abc123-def_456');
      expect(result.valid).toBe(true);
    });

    it('should reject too short ID', () => {
      const result = validateGoogleBooksId('abc123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Google Books ID format');
    });

    it('should reject special characters', () => {
      const result = validateGoogleBooksId('abc123@def456');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Google Books ID format');
    });
  });

  describe('validateCollectionId', () => {
    it('should accept valid UUID', () => {
      const result = validateCollectionId('123e4567-e89b-12d3-a456-426614174000');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = validateCollectionId('invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid collection ID format');
    });
  });

  // =====================================================
  // Enum Validation Tests
  // =====================================================

  describe('validateReadingStatus', () => {
    it('should accept valid reading statuses', () => {
      VALID_READING_STATUS.forEach(status => {
        const result = validateReadingStatus(status);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const result = validateReadingStatus('invalid_status');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid reading status');
      expect(result.details?.valid).toEqual(VALID_READING_STATUS);
    });

    it('should reject empty string', () => {
      const result = validateReadingStatus('');
      expect(result.valid).toBe(false);
    });
  });

  // =====================================================
  // Rating Validation Tests
  // =====================================================

  describe('validateRating', () => {
    it('should accept valid ratings', () => {
      for (let i = RATING_MIN; i <= RATING_MAX; i++) {
        const result = validateRating(i);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject rating below minimum', () => {
      const result = validateRating(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`between ${RATING_MIN} and ${RATING_MAX}`);
    });

    it('should reject rating above maximum', () => {
      const result = validateRating(6);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`between ${RATING_MIN} and ${RATING_MAX}`);
    });

    it('should reject decimal ratings', () => {
      const result = validateRating(3.5);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('whole number');
    });

    it('should reject non-numeric values', () => {
      const result = validateRating('3' as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a number');
    });

    it('should reject null/undefined', () => {
      const result = validateRating(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('is required');
    });
  });

  describe('validateOptionalRating', () => {
    it('should accept null/undefined', () => {
      expect(validateOptionalRating(null).valid).toBe(true);
      expect(validateOptionalRating(undefined).valid).toBe(true);
    });

    it('should validate non-null ratings', () => {
      expect(validateOptionalRating(3).valid).toBe(true);
      expect(validateOptionalRating(0).valid).toBe(false);
    });
  });

  // =====================================================
  // Text Field Validation Tests
  // =====================================================

  describe('validateBookTitle', () => {
    it('should accept valid title', () => {
      const result = validateBookTitle('The Great Gatsby');
      expect(result.valid).toBe(true);
    });

    it('should reject empty title', () => {
      const result = validateBookTitle('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Book title is required');
    });

    it('should reject title exceeding max length', () => {
      const longTitle = 'a'.repeat(TEXT_LIMITS.BOOK_TITLE.max + 1);
      const result = validateBookTitle(longTitle);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`less than ${TEXT_LIMITS.BOOK_TITLE.max}`);
    });

    it('should reject null/undefined', () => {
      const result = validateBookTitle(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('is required');
    });
  });

  describe('validateBookAuthor', () => {
    it('should accept valid author', () => {
      const result = validateBookAuthor('F. Scott Fitzgerald');
      expect(result.valid).toBe(true);
    });

    it('should reject empty author', () => {
      const result = validateBookAuthor('');
      expect(result.valid).toBe(false);
    });

    it('should reject author exceeding max length', () => {
      const longAuthor = 'a'.repeat(TEXT_LIMITS.BOOK_AUTHOR.max + 1);
      const result = validateBookAuthor(longAuthor);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateBookDescription', () => {
    it('should accept valid description', () => {
      const result = validateBookDescription('A classic American novel');
      expect(result.valid).toBe(true);
    });

    it('should accept null/undefined (optional field)', () => {
      expect(validateBookDescription(null).valid).toBe(true);
      expect(validateBookDescription(undefined).valid).toBe(true);
    });

    it('should reject description exceeding max length', () => {
      const longDescription = 'a'.repeat(TEXT_LIMITS.BOOK_DESCRIPTION.max + 1);
      const result = validateBookDescription(longDescription);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateReviewText', () => {
    it('should accept valid review', () => {
      const result = validateReviewText('Great book, highly recommend!');
      expect(result.valid).toBe(true);
    });

    it('should accept null/undefined (optional field)', () => {
      expect(validateReviewText(null).valid).toBe(true);
      expect(validateReviewText(undefined).valid).toBe(true);
    });

    it('should reject review exceeding max length', () => {
      const longReview = 'a'.repeat(TEXT_LIMITS.REVIEW_TEXT.max + 1);
      const result = validateReviewText(longReview);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCollectionName', () => {
    it('should accept valid collection name', () => {
      const result = validateCollectionName('My Favorite Books');
      expect(result.valid).toBe(true);
    });

    it('should reject empty name', () => {
      const result = validateCollectionName('');
      expect(result.valid).toBe(false);
    });

    it('should reject name exceeding max length', () => {
      const longName = 'a'.repeat(TEXT_LIMITS.COLLECTION_NAME.max + 1);
      const result = validateCollectionName(longName);
      expect(result.valid).toBe(false);
    });
  });

  // =====================================================
  // Additional Validation Tests
  // =====================================================

  describe('validateISBN', () => {
    it('should accept valid ISBN-10', () => {
      const result = validateISBN('0-306-40615-2');
      expect(result.valid).toBe(true);
    });

    it('should accept valid ISBN-13', () => {
      const result = validateISBN('978-0-306-40615-7');
      expect(result.valid).toBe(true);
    });

    it('should accept null/undefined (optional field)', () => {
      expect(validateISBN(null).valid).toBe(true);
      expect(validateISBN(undefined).valid).toBe(true);
    });

    it('should accept empty string (optional field)', () => {
      expect(validateISBN('').valid).toBe(true);
    });

    it('should reject invalid ISBN format', () => {
      const result = validateISBN('invalid-isbn');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid ISBN format');
    });
  });

  describe('validatePageCount', () => {
    it('should accept valid page count', () => {
      const result = validatePageCount(350);
      expect(result.valid).toBe(true);
    });

    it('should accept null/undefined (optional field)', () => {
      expect(validatePageCount(null).valid).toBe(true);
      expect(validatePageCount(undefined).valid).toBe(true);
    });

    it('should accept negative page count (treat as null)', () => {
      const result = validatePageCount(-10);
      expect(result.valid).toBe(true);
    });

    it('should accept zero page count (treat as null)', () => {
      const result = validatePageCount(0);
      expect(result.valid).toBe(true);
    });

    it('should accept string numbers', () => {
      expect(validatePageCount('100').valid).toBe(true);
      expect(validatePageCount('0').valid).toBe(true);
    });

    it('should accept invalid strings (treat as null)', () => {
      expect(validatePageCount('abc').valid).toBe(true);
      expect(validatePageCount('').valid).toBe(true);
    });

    it('should accept decimal page count (treat as null)', () => {
      const result = validatePageCount(350.5);
      expect(result.valid).toBe(true);
    });

    it('should reject unreasonably high page count', () => {
      const result = validatePageCount(100000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unreasonably high');
    });
  });

  describe('validatePrivacySetting', () => {
    it('should accept boolean values', () => {
      expect(validatePrivacySetting(true).valid).toBe(true);
      expect(validatePrivacySetting(false).valid).toBe(true);
    });

    it('should accept null/undefined (optional field)', () => {
      expect(validatePrivacySetting(null).valid).toBe(true);
      expect(validatePrivacySetting(undefined).valid).toBe(true);
    });

    it('should reject non-boolean values', () => {
      const result = validatePrivacySetting('true' as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a boolean');
    });
  });

  // =====================================================
  // Error Handling Tests
  // =====================================================

  describe('createValidationError', () => {
    it('should create error with correct properties', () => {
      const error = createValidationError('Test error', 'testField', { test: 'data' });
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('BooksValidationError');
      expect(error.field).toBe('testField');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ test: 'data' });
    });
  });

  describe('throwIfInvalid', () => {
    it('should not throw for valid result', () => {
      expect(() => {
        throwIfInvalid({ valid: true });
      }).not.toThrow();
    });

    it('should throw for invalid result', () => {
      expect(() => {
        throwIfInvalid({ valid: false, error: 'Test error' }, 'testField');
      }).toThrow('Test error');
    });
  });

  describe('validateMultiple', () => {
    it('should return valid for all valid results', () => {
      const result = validateMultiple([
        { result: { valid: true }, field: 'field1' },
        { result: { valid: true }, field: 'field2' }
      ]);
      expect(result.valid).toBe(true);
    });

    it('should collect all errors', () => {
      const result = validateMultiple([
        { result: { valid: false, error: 'Error 1' }, field: 'field1' },
        { result: { valid: false, error: 'Error 2' }, field: 'field2' }
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('field1: Error 1');
      expect(result.error).toContain('field2: Error 2');
    });

    it('should collect details from all errors', () => {
      const result = validateMultiple([
        { result: { valid: false, error: 'Error 1', details: { test1: 'data1' } }, field: 'field1' },
        { result: { valid: false, error: 'Error 2', details: { test2: 'data2' } }, field: 'field2' }
      ]);
      expect(result.details?.field1).toEqual({ test1: 'data1' });
      expect(result.details?.field2).toEqual({ test2: 'data2' });
    });
  });
});
