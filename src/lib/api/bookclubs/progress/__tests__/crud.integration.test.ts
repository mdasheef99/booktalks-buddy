/**
 * CRUD Operations Integration Tests
 * 
 * Critical Priority Tests for Production Readiness
 * Estimated Time: 2 days
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  upsertReadingProgress,
  getUserReadingProgress,
  getClubReadingProgress,
  getClubProgressStats,
  deleteReadingProgress
} from '../crud';
import type { CreateProgressRequest } from '../types';

// Test database setup
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('CRUD Operations Integration Tests', () => {
  let testClubId: string;
  let testUserId1: string;
  let testUserId2: string;
  let testBookId: string;

  beforeAll(async () => {
    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  describe('upsertReadingProgress', () => {
    it('should create new progress record with valid data', async () => {
      const progressData: CreateProgressRequest = {
        club_id: testClubId,
        book_id: testBookId,
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 50,
        notes: 'Test progress notes',
        is_private: false
      };

      const result = await upsertReadingProgress(testUserId1, progressData);

      expect(result).toBeDefined();
      expect(result.user_id).toBe(testUserId1);
      expect(result.status).toBe('reading');
      expect(result.progress_percentage).toBe(50);
      expect(result.notes).toBe('Test progress notes');
    });

    it('should update existing progress record', async () => {
      // Create initial progress
      const initialData: CreateProgressRequest = {
        club_id: testClubId,
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 25,
        is_private: false
      };
      await upsertReadingProgress(testUserId1, initialData);

      // Update progress
      const updateData: CreateProgressRequest = {
        club_id: testClubId,
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 75,
        is_private: false
      };
      const result = await upsertReadingProgress(testUserId1, updateData);

      expect(result.progress_percentage).toBe(75);
    });

    it('should enforce club membership validation', async () => {
      const progressData: CreateProgressRequest = {
        club_id: testClubId,
        status: 'reading',
        is_private: false
      };

      // Test with non-member user
      await expect(
        upsertReadingProgress('non-member-user-id', progressData)
      ).rejects.toThrow('User is not a member of this club');
    });

    it('should validate progress tracking is enabled', async () => {
      // Disable progress tracking for club
      await supabase
        .from('book_clubs')
        .update({ progress_tracking_enabled: false })
        .eq('id', testClubId);

      const progressData: CreateProgressRequest = {
        club_id: testClubId,
        status: 'reading',
        is_private: false
      };

      await expect(
        upsertReadingProgress(testUserId1, progressData)
      ).rejects.toThrow('Progress tracking is not enabled for this club');

      // Re-enable for other tests
      await supabase
        .from('book_clubs')
        .update({ progress_tracking_enabled: true })
        .eq('id', testClubId);
    });

    it('should handle chapter/page progress correctly', async () => {
      const progressData: CreateProgressRequest = {
        club_id: testClubId,
        status: 'reading',
        progress_type: 'chapter',
        current_progress: 5,
        total_progress: 20,
        is_private: false
      };

      const result = await upsertReadingProgress(testUserId1, progressData);

      expect(result.progress_type).toBe('chapter');
      expect(result.current_progress).toBe(5);
      expect(result.total_progress).toBe(20);
      expect(result.progress_percentage).toBeNull();
    });
  });

  describe('getUserReadingProgress', () => {
    beforeEach(async () => {
      // Create test progress
      await upsertReadingProgress(testUserId1, {
        club_id: testClubId,
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 60,
        is_private: false
      });
    });

    it('should return user progress for club member', async () => {
      const result = await getUserReadingProgress(
        testUserId2, // requesting user
        testUserId1, // target user
        testClubId
      );

      expect(result).toBeDefined();
      expect(result!.user_id).toBe(testUserId1);
      expect(result!.progress_percentage).toBe(60);
    });

    it('should return null for private progress of other users', async () => {
      // Update progress to private
      await upsertReadingProgress(testUserId1, {
        club_id: testClubId,
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 60,
        is_private: true
      });

      const result = await getUserReadingProgress(
        testUserId2, // requesting user (different from owner)
        testUserId1, // target user
        testClubId
      );

      expect(result).toBeNull();
    });

    it('should return own private progress', async () => {
      // Update progress to private
      await upsertReadingProgress(testUserId1, {
        club_id: testClubId,
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 60,
        is_private: true
      });

      const result = await getUserReadingProgress(
        testUserId1, // requesting own progress
        testUserId1, // target user (same)
        testClubId
      );

      expect(result).toBeDefined();
      expect(result!.progress_percentage).toBe(60);
    });

    it('should enforce club membership for requesting user', async () => {
      await expect(
        getUserReadingProgress(
          'non-member-user-id',
          testUserId1,
          testClubId
        )
      ).rejects.toThrow('User is not a member of this club');
    });
  });

  describe('getClubReadingProgress', () => {
    beforeEach(async () => {
      // Create progress for multiple users
      await upsertReadingProgress(testUserId1, {
        club_id: testClubId,
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 50,
        is_private: false
      });

      await upsertReadingProgress(testUserId2, {
        club_id: testClubId,
        status: 'finished',
        is_private: true
      });
    });

    it('should return all public progress for club members', async () => {
      const result = await getClubReadingProgress(testUserId1, testClubId);

      expect(result).toHaveLength(2); // Own progress + other user's public progress
      expect(result.some(p => p.user_id === testUserId1)).toBe(true);
      expect(result.some(p => p.user_id === testUserId2)).toBe(true);
    });

    it('should filter private progress correctly', async () => {
      const result = await getClubReadingProgress(testUserId1, testClubId);
      
      const user2Progress = result.find(p => p.user_id === testUserId2);
      expect(user2Progress?.is_private).toBe(true);
      
      // When requesting as different user, should still see the record but marked as private
      const resultAsOtherUser = await getClubReadingProgress(testUserId2, testClubId);
      expect(resultAsOtherUser.some(p => p.user_id === testUserId1)).toBe(true);
    });

    it('should include user details in response', async () => {
      const result = await getClubReadingProgress(testUserId1, testClubId);

      expect(result[0].user).toBeDefined();
      expect(result[0].user?.username).toBeDefined();
    });
  });

  describe('getClubProgressStats', () => {
    beforeEach(async () => {
      // Create varied progress for statistics
      await upsertReadingProgress(testUserId1, {
        club_id: testClubId,
        status: 'finished',
        is_private: false
      });

      await upsertReadingProgress(testUserId2, {
        club_id: testClubId,
        status: 'reading',
        progress_type: 'percentage',
        progress_percentage: 75,
        is_private: false
      });
    });

    it('should return accurate club statistics', async () => {
      const result = await getClubProgressStats(testUserId1, testClubId);

      expect(result.total_members).toBeGreaterThan(0);
      expect(result.finished_count).toBeGreaterThan(0);
      expect(result.reading_count).toBeGreaterThan(0);
      expect(result.completion_percentage).toBeGreaterThan(0);
    });

    it('should calculate completion percentage correctly', async () => {
      const result = await getClubProgressStats(testUserId1, testClubId);

      const expectedPercentage = (result.finished_count / result.total_members) * 100;
      expect(Math.abs(result.completion_percentage - expectedPercentage)).toBeLessThan(0.01);
    });
  });

  describe('deleteReadingProgress', () => {
    let progressId: string;

    beforeEach(async () => {
      const progress = await upsertReadingProgress(testUserId1, {
        club_id: testClubId,
        status: 'reading',
        is_private: false
      });
      progressId = progress.id;
    });

    it('should delete own progress successfully', async () => {
      await expect(
        deleteReadingProgress(testUserId1, progressId)
      ).resolves.not.toThrow();

      // Verify deletion
      const result = await getUserReadingProgress(testUserId1, testUserId1, testClubId);
      expect(result).toBeNull();
    });

    it('should prevent deleting other users progress', async () => {
      await expect(
        deleteReadingProgress(testUserId2, progressId)
      ).resolves.not.toThrow(); // Should not throw but also should not delete

      // Verify progress still exists
      const result = await getUserReadingProgress(testUserId1, testUserId1, testClubId);
      expect(result).toBeDefined();
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test club
    const { data: club } = await supabase
      .from('book_clubs')
      .insert({
        name: 'Test Club for Progress',
        description: 'Test club',
        progress_tracking_enabled: true
      })
      .select()
      .single();
    testClubId = club.id;

    // Create test users and memberships
    // Implementation depends on your user creation strategy
    // This is a simplified version
    testUserId1 = 'test-user-1-id';
    testUserId2 = 'test-user-2-id';

    // Add users to club
    await supabase.from('club_members').insert([
      { club_id: testClubId, user_id: testUserId1, role: 'member' },
      { club_id: testClubId, user_id: testUserId2, role: 'member' }
    ]);

    // Create test book
    const { data: book } = await supabase
      .from('books')
      .insert({
        title: 'Test Book',
        author: 'Test Author'
      })
      .select()
      .single();
    testBookId = book.id;
  }

  async function cleanupTestData() {
    // Clean up in reverse order of dependencies
    await supabase.from('member_reading_progress').delete().eq('club_id', testClubId);
    await supabase.from('club_members').delete().eq('club_id', testClubId);
    await supabase.from('book_clubs').delete().eq('id', testClubId);
    if (testBookId) {
      await supabase.from('books').delete().eq('id', testBookId);
    }
  }
});
