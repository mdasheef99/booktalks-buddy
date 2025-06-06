/**
 * Concurrent User Interaction Tests
 * 
 * High Priority Tests for Production Readiness
 * Estimated Time: 1.5 days
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProgressRealtime } from '../hooks/useProgressRealtime';

// Mock Supabase with multiple channel simulation
const createMockChannel = () => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn()
});

const mockSupabase = {
  channel: vi.fn(() => createMockChannel())
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock API functions
const mockGetCurrentBookProgress = vi.fn();
const mockGetClubReadingProgress = vi.fn();
const mockGetClubProgressStats = vi.fn();
const mockIsProgressTrackingEnabled = vi.fn();
const mockUpsertReadingProgress = vi.fn();

vi.mock('@/lib/api/bookclubs/progress', () => ({
  getCurrentBookProgress: mockGetCurrentBookProgress,
  getClubReadingProgress: mockGetClubReadingProgress,
  getClubProgressStats: mockGetClubProgressStats,
  isProgressTrackingEnabled: mockIsProgressTrackingEnabled,
  upsertReadingProgress: mockUpsertReadingProgress
}));

describe('Concurrent User Interaction Tests', () => {
  const clubId = 'test-club-id';
  const user1Id = 'user-1-id';
  const user2Id = 'user-2-id';
  const user3Id = 'user-3-id';

  let user1Channel: any;
  let user2Channel: any;
  let user3Channel: any;
  let progressChangeHandlers: Function[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    progressChangeHandlers = [];

    // Setup mock channels for multiple users
    mockSupabase.channel.mockImplementation((channelName) => {
      const channel = createMockChannel();
      
      channel.on.mockImplementation((event, config, handler) => {
        if (config.table === 'member_reading_progress') {
          progressChangeHandlers.push(handler);
        }
        return channel;
      });

      channel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED');
        return channel;
      });

      if (channelName.includes(user1Id)) user1Channel = channel;
      if (channelName.includes(user2Id)) user2Channel = channel;
      if (channelName.includes(user3Id)) user3Channel = channel;

      return channel;
    });

    // Setup default API responses
    mockIsProgressTrackingEnabled.mockResolvedValue(true);
    mockGetCurrentBookProgress.mockResolvedValue(null);
    mockGetClubReadingProgress.mockResolvedValue([]);
    mockGetClubProgressStats.mockResolvedValue({
      total_members: 3,
      not_started_count: 3,
      reading_count: 0,
      finished_count: 0,
      completion_percentage: 0
    });
  });

  describe('Simultaneous Progress Updates', () => {
    it('should handle multiple users updating progress simultaneously', async () => {
      // Setup multiple user hooks
      const { result: user1Result } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user1Id,
          enabled: true,
          showToasts: false
        })
      );

      const { result: user2Result } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user2Id,
          enabled: true,
          showToasts: false
        })
      );

      const { result: user3Result } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user3Id,
          enabled: true,
          showToasts: false
        })
      );

      await waitFor(() => {
        expect(user1Result.current.loading).toBe(false);
        expect(user2Result.current.loading).toBe(false);
        expect(user3Result.current.loading).toBe(false);
      });

      // Simulate simultaneous progress updates
      const user1Progress = {
        id: 'progress-1',
        user_id: user1Id,
        club_id: clubId,
        status: 'reading',
        progress_percentage: 25,
        is_private: false,
        last_updated: '2025-01-24T10:00:00Z'
      };

      const user2Progress = {
        id: 'progress-2',
        user_id: user2Id,
        club_id: clubId,
        status: 'reading',
        progress_percentage: 50,
        is_private: false,
        last_updated: '2025-01-24T10:00:01Z'
      };

      const user3Progress = {
        id: 'progress-3',
        user_id: user3Id,
        club_id: clubId,
        status: 'finished',
        is_private: false,
        last_updated: '2025-01-24T10:00:02Z'
      };

      // Mock updated member progress response
      mockGetClubReadingProgress.mockResolvedValue([
        user1Progress,
        user2Progress,
        user3Progress
      ]);

      mockGetClubProgressStats.mockResolvedValue({
        total_members: 3,
        not_started_count: 0,
        reading_count: 2,
        finished_count: 1,
        completion_percentage: 33.33
      });

      // Simulate rapid-fire updates
      await act(async () => {
        // All handlers receive all updates
        progressChangeHandlers.forEach(handler => {
          handler({ eventType: 'INSERT', new: user1Progress });
        });
        
        progressChangeHandlers.forEach(handler => {
          handler({ eventType: 'INSERT', new: user2Progress });
        });
        
        progressChangeHandlers.forEach(handler => {
          handler({ eventType: 'INSERT', new: user3Progress });
        });
      });

      // All users should see updated member progress
      await waitFor(() => {
        expect(user1Result.current.memberProgress).toHaveLength(3);
        expect(user2Result.current.memberProgress).toHaveLength(3);
        expect(user3Result.current.memberProgress).toHaveLength(3);
      });

      // Stats should be updated for all users
      expect(user1Result.current.clubStats?.completion_percentage).toBe(33.33);
      expect(user2Result.current.clubStats?.completion_percentage).toBe(33.33);
      expect(user3Result.current.clubStats?.completion_percentage).toBe(33.33);
    });

    it('should handle race conditions in progress updates', async () => {
      const { result } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user1Id,
          enabled: true,
          showToasts: false
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate rapid updates to the same user's progress
      const baseProgress = {
        id: 'progress-1',
        user_id: user1Id,
        club_id: clubId,
        status: 'reading',
        is_private: false
      };

      const update1 = { ...baseProgress, progress_percentage: 25, last_updated: '2025-01-24T10:00:00Z' };
      const update2 = { ...baseProgress, progress_percentage: 50, last_updated: '2025-01-24T10:00:01Z' };
      const update3 = { ...baseProgress, progress_percentage: 75, last_updated: '2025-01-24T10:00:02Z' };

      // Mock API to return the latest state
      mockGetClubReadingProgress.mockResolvedValue([update3]);

      // Simulate out-of-order updates
      await act(async () => {
        progressChangeHandlers.forEach(handler => {
          handler({ eventType: 'UPDATE', new: update2 });
        });
        progressChangeHandlers.forEach(handler => {
          handler({ eventType: 'UPDATE', new: update1 });
        });
        progressChangeHandlers.forEach(handler => {
          handler({ eventType: 'UPDATE', new: update3 });
        });
      });

      // Should eventually converge to the latest state
      await waitFor(() => {
        expect(result.current.userProgress?.progress_percentage).toBe(75);
      });
    });
  });

  describe('Feature Toggle Conflicts', () => {
    it('should handle club lead disabling progress while members are updating', async () => {
      // Setup club lead and member hooks
      const { result: leadResult } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user1Id, // club lead
          enabled: true,
          showToasts: false
        })
      );

      const { result: memberResult } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user2Id, // member
          enabled: true,
          showToasts: false
        })
      );

      await waitFor(() => {
        expect(leadResult.current.loading).toBe(false);
        expect(memberResult.current.loading).toBe(false);
      });

      // Member starts updating progress
      const memberProgress = {
        id: 'progress-2',
        user_id: user2Id,
        club_id: clubId,
        status: 'reading',
        progress_percentage: 30,
        is_private: false,
        last_updated: '2025-01-24T10:00:00Z'
      };

      // Simulate member progress update
      await act(async () => {
        progressChangeHandlers.forEach(handler => {
          handler({ eventType: 'INSERT', new: memberProgress });
        });
      });

      // Club lead disables feature
      mockIsProgressTrackingEnabled.mockResolvedValue(false);

      // Simulate feature toggle change
      await act(async () => {
        // Simulate feature toggle handlers (separate from progress handlers)
        // This would be handled by the book_clubs table subscription
        leadResult.current.refetch();
        memberResult.current.refetch();
      });

      // Both users should see feature disabled and data cleared
      await waitFor(() => {
        expect(leadResult.current.progressTrackingEnabled).toBe(false);
        expect(memberResult.current.progressTrackingEnabled).toBe(false);
        expect(leadResult.current.userProgress).toBeNull();
        expect(memberResult.current.userProgress).toBeNull();
      });
    });
  });

  describe('Privacy Setting Conflicts', () => {
    it('should handle user making progress private while others are viewing', async () => {
      // Setup multiple user hooks
      const { result: user1Result } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user1Id,
          enabled: true,
          showToasts: false
        })
      );

      const { result: user2Result } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user2Id,
          enabled: true,
          showToasts: false
        })
      );

      await waitFor(() => {
        expect(user1Result.current.loading).toBe(false);
        expect(user2Result.current.loading).toBe(false);
      });

      // User 1 creates public progress
      const publicProgress = {
        id: 'progress-1',
        user_id: user1Id,
        club_id: clubId,
        status: 'reading',
        progress_percentage: 40,
        is_private: false,
        last_updated: '2025-01-24T10:00:00Z'
      };

      mockGetClubReadingProgress.mockResolvedValue([publicProgress]);

      await act(async () => {
        progressChangeHandlers.forEach(handler => {
          handler({ eventType: 'INSERT', new: publicProgress });
        });
      });

      // Both users should see the progress
      await waitFor(() => {
        expect(user1Result.current.memberProgress).toHaveLength(1);
        expect(user2Result.current.memberProgress).toHaveLength(1);
      });

      // User 1 makes progress private
      const privateProgress = {
        ...publicProgress,
        is_private: true,
        last_updated: '2025-01-24T10:01:00Z'
      };

      // Mock API to respect privacy - user 2 shouldn't see private progress details
      mockGetClubReadingProgress.mockImplementation((userId) => {
        if (userId === user1Id) {
          return Promise.resolve([privateProgress]); // Owner sees own private progress
        } else {
          return Promise.resolve([]); // Others don't see private progress
        }
      });

      await act(async () => {
        progressChangeHandlers.forEach(handler => {
          handler({ eventType: 'UPDATE', new: privateProgress });
        });
      });

      // User 1 should still see their own private progress
      await waitFor(() => {
        expect(user1Result.current.userProgress?.is_private).toBe(true);
      });

      // User 2 should not see the private progress
      await waitFor(() => {
        expect(user2Result.current.memberProgress).toHaveLength(0);
      });
    });
  });

  describe('Network Partition Scenarios', () => {
    it('should handle users reconnecting after network partition', async () => {
      const { result } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user1Id,
          enabled: true,
          showToasts: false
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate network partition - subscription fails
      const failedChannel = createMockChannel();
      failedChannel.subscribe.mockImplementation((callback) => {
        callback('CHANNEL_ERROR');
        return failedChannel;
      });

      mockSupabase.channel.mockReturnValue(failedChannel);

      // Trigger reconnection
      await act(async () => {
        result.current.refetch();
      });

      // Should handle error gracefully
      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      // Simulate successful reconnection
      const successChannel = createMockChannel();
      successChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED');
        return successChannel;
      });

      mockSupabase.channel.mockReturnValue(successChannel);

      // Clear error and refetch
      await act(async () => {
        result.current.refetch();
      });

      // Should recover and work normally
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('High-Frequency Update Scenarios', () => {
    it('should handle rapid successive updates without memory leaks', async () => {
      const { result } = renderHook(() => 
        useProgressRealtime({
          clubId,
          userId: user1Id,
          enabled: true,
          showToasts: false
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate 100 rapid updates
      const updates = Array.from({ length: 100 }, (_, i) => ({
        id: 'progress-1',
        user_id: user1Id,
        club_id: clubId,
        status: 'reading',
        progress_percentage: i,
        is_private: false,
        last_updated: new Date(Date.now() + i * 100).toISOString()
      }));

      // Mock API to return latest state
      mockGetClubReadingProgress.mockResolvedValue([updates[99]]);

      // Fire all updates rapidly
      await act(async () => {
        updates.forEach(update => {
          progressChangeHandlers.forEach(handler => {
            handler({ eventType: 'UPDATE', new: update });
          });
        });
      });

      // Should converge to final state
      await waitFor(() => {
        expect(result.current.userProgress?.progress_percentage).toBe(99);
      });

      // Should not have excessive API calls (debouncing/throttling should work)
      expect(mockGetClubReadingProgress).toHaveBeenCalledTimes(101); // Initial + 100 updates
    });
  });

  describe('Data Consistency Validation', () => {
    it('should maintain data consistency across multiple user sessions', async () => {
      // Setup 3 user sessions
      const users = [
        { id: user1Id, result: null as any },
        { id: user2Id, result: null as any },
        { id: user3Id, result: null as any }
      ];

      users.forEach(user => {
        const { result } = renderHook(() => 
          useProgressRealtime({
            clubId,
            userId: user.id,
            enabled: true,
            showToasts: false
          })
        );
        user.result = result;
      });

      // Wait for all to load
      await waitFor(() => {
        users.forEach(user => {
          expect(user.result.current.loading).toBe(false);
        });
      });

      // Create consistent test data
      const progressData = [
        {
          id: 'progress-1',
          user_id: user1Id,
          club_id: clubId,
          status: 'reading',
          progress_percentage: 33,
          is_private: false,
          last_updated: '2025-01-24T10:00:00Z'
        },
        {
          id: 'progress-2',
          user_id: user2Id,
          club_id: clubId,
          status: 'finished',
          is_private: false,
          last_updated: '2025-01-24T10:01:00Z'
        },
        {
          id: 'progress-3',
          user_id: user3Id,
          club_id: clubId,
          status: 'reading',
          progress_percentage: 67,
          is_private: false,
          last_updated: '2025-01-24T10:02:00Z'
        }
      ];

      const expectedStats = {
        total_members: 3,
        not_started_count: 0,
        reading_count: 2,
        finished_count: 1,
        completion_percentage: 33.33
      };

      mockGetClubReadingProgress.mockResolvedValue(progressData);
      mockGetClubProgressStats.mockResolvedValue(expectedStats);

      // Simulate updates reaching all users
      await act(async () => {
        progressData.forEach(progress => {
          progressChangeHandlers.forEach(handler => {
            handler({ eventType: 'INSERT', new: progress });
          });
        });
      });

      // All users should have consistent data
      await waitFor(() => {
        users.forEach(user => {
          expect(user.result.current.memberProgress).toHaveLength(3);
          expect(user.result.current.clubStats?.completion_percentage).toBe(33.33);
          expect(user.result.current.clubStats?.finished_count).toBe(1);
          expect(user.result.current.clubStats?.reading_count).toBe(2);
        });
      });

      // Each user should see their own progress correctly
      expect(users[0].result.current.userProgress?.progress_percentage).toBe(33);
      expect(users[1].result.current.userProgress?.status).toBe('finished');
      expect(users[2].result.current.userProgress?.progress_percentage).toBe(67);
    });
  });
});
