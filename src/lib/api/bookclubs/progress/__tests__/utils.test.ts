/**
 * Reading Progress Management - Utility Tests
 * 
 * Test suite for utility functions in the reading progress system.
 */

import { describe, it, expect } from '@jest/globals';
import {
  formatProgressDisplay,
  calculateCompletionPercentage,
  formatProgressStatus,
  isValidProgressType,
  isValidProgressStatus,
  sanitizeNotes
} from '../utils';
import type { ReadingProgress } from '../types';

describe('Reading Progress Utils', () => {
  describe('formatProgressDisplay', () => {
    it('should format not started status', () => {
      const progress: ReadingProgress = {
        id: '1',
        club_id: 'club-1',
        user_id: 'user-1',
        book_id: 'book-1',
        status: 'not_started',
        progress_type: null,
        current_progress: null,
        total_progress: null,
        progress_percentage: null,
        notes: null,
        is_private: false,
        started_at: null,
        finished_at: null,
        last_updated: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(formatProgressDisplay(progress)).toBe('Not Started');
    });

    it('should format finished status', () => {
      const progress: ReadingProgress = {
        id: '1',
        club_id: 'club-1',
        user_id: 'user-1',
        book_id: 'book-1',
        status: 'finished',
        progress_type: null,
        current_progress: null,
        total_progress: null,
        progress_percentage: null,
        notes: null,
        is_private: false,
        started_at: '2024-01-01T00:00:00Z',
        finished_at: '2024-01-01T12:00:00Z',
        last_updated: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(formatProgressDisplay(progress)).toBe('Finished');
    });

    it('should format percentage progress', () => {
      const progress: ReadingProgress = {
        id: '1',
        club_id: 'club-1',
        user_id: 'user-1',
        book_id: 'book-1',
        status: 'reading',
        progress_type: 'percentage',
        current_progress: null,
        total_progress: null,
        progress_percentage: 75,
        notes: null,
        is_private: false,
        started_at: '2024-01-01T00:00:00Z',
        finished_at: null,
        last_updated: '2024-01-01T06:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(formatProgressDisplay(progress)).toBe('75%');
    });

    it('should format chapter progress', () => {
      const progress: ReadingProgress = {
        id: '1',
        club_id: 'club-1',
        user_id: 'user-1',
        book_id: 'book-1',
        status: 'reading',
        progress_type: 'chapter',
        current_progress: 5,
        total_progress: 10,
        progress_percentage: null,
        notes: null,
        is_private: false,
        started_at: '2024-01-01T00:00:00Z',
        finished_at: null,
        last_updated: '2024-01-01T06:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(formatProgressDisplay(progress)).toBe('Chapter 5/10');
    });

    it('should format page progress', () => {
      const progress: ReadingProgress = {
        id: '1',
        club_id: 'club-1',
        user_id: 'user-1',
        book_id: 'book-1',
        status: 'reading',
        progress_type: 'page',
        current_progress: 150,
        total_progress: 300,
        progress_percentage: null,
        notes: null,
        is_private: false,
        started_at: '2024-01-01T00:00:00Z',
        finished_at: null,
        last_updated: '2024-01-01T06:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(formatProgressDisplay(progress)).toBe('Page 150/300');
    });

    it('should default to "Reading" for incomplete data', () => {
      const progress: ReadingProgress = {
        id: '1',
        club_id: 'club-1',
        user_id: 'user-1',
        book_id: 'book-1',
        status: 'reading',
        progress_type: 'percentage',
        current_progress: null,
        total_progress: null,
        progress_percentage: null,
        notes: null,
        is_private: false,
        started_at: '2024-01-01T00:00:00Z',
        finished_at: null,
        last_updated: '2024-01-01T06:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(formatProgressDisplay(progress)).toBe('Reading');
    });
  });

  describe('calculateCompletionPercentage', () => {
    it('should calculate correct percentage', () => {
      expect(calculateCompletionPercentage(5, 10)).toBe(50);
      expect(calculateCompletionPercentage(3, 4)).toBe(75);
      expect(calculateCompletionPercentage(1, 3)).toBe(33);
    });

    it('should handle zero total', () => {
      expect(calculateCompletionPercentage(5, 0)).toBe(0);
    });

    it('should handle negative total', () => {
      expect(calculateCompletionPercentage(5, -1)).toBe(0);
    });
  });

  describe('formatProgressStatus', () => {
    it('should format all status values correctly', () => {
      expect(formatProgressStatus('not_started')).toBe('Not Started');
      expect(formatProgressStatus('reading')).toBe('Reading');
      expect(formatProgressStatus('finished')).toBe('Finished');
    });

    it('should handle unknown status', () => {
      expect(formatProgressStatus('unknown' as any)).toBe('Unknown');
    });
  });

  describe('isValidProgressType', () => {
    it('should validate correct progress types', () => {
      expect(isValidProgressType('percentage')).toBe(true);
      expect(isValidProgressType('chapter')).toBe(true);
      expect(isValidProgressType('page')).toBe(true);
    });

    it('should reject invalid progress types', () => {
      expect(isValidProgressType('invalid')).toBe(false);
      expect(isValidProgressType('')).toBe(false);
    });
  });

  describe('isValidProgressStatus', () => {
    it('should validate correct status values', () => {
      expect(isValidProgressStatus('not_started')).toBe(true);
      expect(isValidProgressStatus('reading')).toBe(true);
      expect(isValidProgressStatus('finished')).toBe(true);
    });

    it('should reject invalid status values', () => {
      expect(isValidProgressStatus('invalid')).toBe(false);
      expect(isValidProgressStatus('')).toBe(false);
    });
  });

  describe('sanitizeNotes', () => {
    it('should trim whitespace', () => {
      expect(sanitizeNotes('  hello world  ')).toBe('hello world');
    });

    it('should limit length to 500 characters', () => {
      const longText = 'a'.repeat(600);
      const sanitized = sanitizeNotes(longText);
      expect(sanitized.length).toBe(500);
    });

    it('should handle empty notes', () => {
      expect(sanitizeNotes('')).toBe('');
      expect(sanitizeNotes(null as any)).toBe('');
      expect(sanitizeNotes(undefined as any)).toBe('');
    });
  });
});
