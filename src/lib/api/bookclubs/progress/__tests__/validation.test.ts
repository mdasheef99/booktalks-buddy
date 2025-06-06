/**
 * Reading Progress Management - Validation Tests
 * 
 * Test suite for validation functions in the reading progress system.
 */

import { describe, it, expect } from 'vitest';
import {
  validateProgressData,
  validateClubId,
  validateUserId,
  validateProgressId,
  VALID_STATUS_VALUES,
  VALID_PROGRESS_TYPES,
  MAX_NOTES_LENGTH
} from '../validation';
import type { CreateProgressRequest, UpdateProgressRequest } from '../types';

describe('Reading Progress Validation', () => {
  describe('validateProgressData', () => {
    it('should validate valid progress data', () => {
      const validData: CreateProgressRequest = {
        club_id: 'club-123',
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 50,
        is_private: false
      };

      expect(() => validateProgressData(validData)).not.toThrow();
    });

    it('should reject invalid status', () => {
      const invalidData = {
        club_id: 'club-123',
        status: 'invalid-status'
      } as CreateProgressRequest;

      expect(() => validateProgressData(invalidData)).toThrow('Invalid status');
    });

    it('should reject invalid progress type', () => {
      const invalidData: CreateProgressRequest = {
        club_id: 'club-123',
        status: 'reading',
        progress_type: 'invalid-type' as any
      };

      expect(() => validateProgressData(invalidData)).toThrow('Invalid progress type');
    });

    it('should validate percentage progress correctly', () => {
      const validPercentage: CreateProgressRequest = {
        club_id: 'club-123',
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 75
      };

      expect(() => validateProgressData(validPercentage)).not.toThrow();
    });

    it('should reject invalid percentage values', () => {
      const invalidPercentage: CreateProgressRequest = {
        club_id: 'club-123',
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 150
      };

      expect(() => validateProgressData(invalidPercentage)).toThrow('Progress percentage must be between');
    });

    it('should validate chapter/page progress correctly', () => {
      const validChapter: CreateProgressRequest = {
        club_id: 'club-123',
        status: 'reading',
        progress_type: 'chapter',
        current_progress: 5,
        total_progress: 10
      };

      expect(() => validateProgressData(validChapter)).not.toThrow();
    });

    it('should reject invalid chapter/page values', () => {
      const invalidChapter: CreateProgressRequest = {
        club_id: 'club-123',
        status: 'reading',
        progress_type: 'chapter',
        current_progress: 15,
        total_progress: 10
      };

      expect(() => validateProgressData(invalidChapter)).toThrow('Invalid current/total progress values');
    });

    it('should validate notes length', () => {
      const longNotes = 'a'.repeat(MAX_NOTES_LENGTH + 1);
      const invalidData: CreateProgressRequest = {
        club_id: 'club-123',
        status: 'reading',
        notes: longNotes
      };

      expect(() => validateProgressData(invalidData)).toThrow('Notes cannot exceed');
    });
  });

  describe('validateClubId', () => {
    it('should accept valid club ID', () => {
      expect(() => validateClubId('club-123')).not.toThrow();
    });

    it('should reject empty club ID', () => {
      expect(() => validateClubId('')).toThrow('Club ID is required');
    });

    it('should reject null club ID', () => {
      expect(() => validateClubId(null as any)).toThrow('Club ID is required');
    });
  });

  describe('validateUserId', () => {
    it('should accept valid user ID', () => {
      expect(() => validateUserId('user-123')).not.toThrow();
    });

    it('should reject empty user ID', () => {
      expect(() => validateUserId('')).toThrow('User ID is required');
    });
  });

  describe('validateProgressId', () => {
    it('should accept valid progress ID', () => {
      expect(() => validateProgressId('progress-123')).not.toThrow();
    });

    it('should reject empty progress ID', () => {
      expect(() => validateProgressId('')).toThrow('Progress ID is required');
    });
  });

  describe('Constants', () => {
    it('should have correct valid status values', () => {
      expect(VALID_STATUS_VALUES).toEqual(['not_started', 'reading', 'finished']);
    });

    it('should have correct valid progress types', () => {
      expect(VALID_PROGRESS_TYPES).toEqual(['percentage', 'chapter', 'page']);
    });

    it('should have correct max notes length', () => {
      expect(MAX_NOTES_LENGTH).toBe(500);
    });
  });
});
