/**
 * Real-time Subscription Management Tests
 * 
 * Critical Priority Tests for Production Readiness
 * Estimated Time: 1.5 days
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Supabase client - define before importing the hook
vi.mock('@/lib/supabase', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  };

  return {
    supabase: {
      channel: vi.fn(() => mockChannel)
    }
  };
});

// Mock API functions
vi.mock('@/lib/api/bookclubs/progress', () => ({
  getCurrentBookProgress: vi.fn(),
  getClubReadingProgress: vi.fn(),
  getClubProgressStats: vi.fn(),
  isProgressTrackingEnabled: vi.fn()
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

import { useProgressRealtime } from '../hooks/useProgressRealtime';
import { supabase } from '@/lib/supabase';
import * as progressAPI from '@/lib/api/bookclubs/progress';

// Get references to mocked functions
const mockSupabase = vi.mocked(supabase);
const mockGetCurrentBookProgress = vi.mocked(progressAPI.getCurrentBookProgress);
const mockGetClubReadingProgress = vi.mocked(progressAPI.getClubReadingProgress);
const mockGetClubProgressStats = vi.mocked(progressAPI.getClubProgressStats);
const mockIsProgressTrackingEnabled = vi.mocked(progressAPI.isProgressTrackingEnabled);

// Get reference to the mocked channel
let mockChannel: any;

describe('useProgressRealtime Hook', () => {
  const defaultProps = {
    clubId: 'test-club-id',
    userId: 'test-user-id',
    enabled: true
  };

  const mockUserProgress = {
    id: 'progress-1',
    user_id: 'test-user-id',
    club_id: 'test-club-id',
    status: 'reading' as const,
    progress_percentage: 50,
    is_private: false,
    created_at: '2025-01-24T10:00:00Z',
    last_updated: '2025-01-24T10:00:00Z'
  };

  const mockMemberProgress = [
    mockUserProgress,
    {
      id: 'progress-2',
      user_id: 'other-user-id',
      club_id: 'test-club-id',
      status: 'finished' as const,
      is_private: false,
      created_at: '2025-01-24T09:00:00Z',
      last_updated: '2025-01-24T11:00:00Z'
    }
  ];

  const mockClubStats = {
    total_members: 5,
    not_started_count: 1,
    reading_count: 2,
    finished_count: 2,
    completion_percentage: 40
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Get fresh reference to mocked channel
    mockChannel = (mockSupabase.channel as any).mock.results[0]?.value || {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    };

    // Setup default mock responses
    mockIsProgressTrackingEnabled.mockResolvedValue(true);
    mockGetCurrentBookProgress.mockResolvedValue(mockUserProgress);
    mockGetClubReadingProgress.mockResolvedValue(mockMemberProgress);
    mockGetClubProgressStats.mockResolvedValue(mockClubStats);

    mockChannel.subscribe.mockImplementation((callback: any) => {
      callback('SUBSCRIBED');
      return mockChannel;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial Data Loading', () => {
    it('should load initial data when enabled', async () => {
      const { result } = renderHook(() => useProgressRealtime(defaultProps));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockIsProgressTrackingEnabled).toHaveBeenCalledWith('test-club-id');
      expect(mockGetCurrentBookProgress).toHaveBeenCalledWith('test-user-id', 'test-user-id', 'test-club-id');
      expect(mockGetClubReadingProgress).toHaveBeenCalledWith('test-user-id', 'test-club-id');
      expect(mockGetClubProgressStats).toHaveBeenCalledWith('test-club-id');

      expect(result.current.userProgress).toEqual(mockUserProgress);
      expect(result.current.memberProgress).toEqual(mockMemberProgress);
      expect(result.current.clubStats).toEqual(mockClubStats);
      expect(result.current.progressTrackingEnabled).toBe(true);
    });

    it('should not load data when disabled', async () => {
      renderHook(() => useProgressRealtime({ ...defaultProps, enabled: false }));

      await waitFor(() => {
        expect(mockIsProgressTrackingEnabled).not.toHaveBeenCalled();
      });
    });

    it('should handle progress tracking disabled', async () => {
      mockIsProgressTrackingEnabled.mockResolvedValue(false);

      const { result } = renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progressTrackingEnabled).toBe(false);
      expect(result.current.userProgress).toBeNull();
      expect(result.current.memberProgress).toEqual([]);
      expect(result.current.clubStats).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockIsProgressTrackingEnabled.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Subscription Management', () => {
    it('should create subscription when enabled', async () => {
      renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('club_progress_test-club-id');
      });

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_reading_progress',
          filter: 'club_id=eq.test-club-id'
        },
        expect.any(Function)
      );

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'book_clubs',
          filter: 'id=eq.test-club-id'
        },
        expect.any(Function)
      );

      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should cleanup subscription on unmount', async () => {
      const { unmount } = renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });

      unmount();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should handle subscription status changes', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('CHANNEL_ERROR');
        return mockChannel;
      });

      const { result } = renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Channel error for club progress')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle subscription timeout', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('TIMED_OUT');
        return mockChannel;
      });

      const { result } = renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subscription timed out')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Real-time Updates', () => {
    it('should handle progress change for current user', async () => {
      let progressChangeHandler: Function;
      
      mockChannel.on.mockImplementation((event, config, handler) => {
        if (config.table === 'member_reading_progress') {
          progressChangeHandler = handler;
        }
        return mockChannel;
      });

      const { result } = renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate progress change
      const updatedProgress = {
        ...mockUserProgress,
        progress_percentage: 75
      };

      await act(async () => {
        progressChangeHandler({
          eventType: 'UPDATE',
          new: updatedProgress
        });
      });

      await waitFor(() => {
        expect(result.current.userProgress?.progress_percentage).toBe(75);
      });
    });

    it('should handle feature toggle changes', async () => {
      let featureToggleHandler: Function;
      
      mockChannel.on.mockImplementation((event, config, handler) => {
        if (config.table === 'book_clubs') {
          featureToggleHandler = handler;
        }
        return mockChannel;
      });

      const { result } = renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate feature toggle
      await act(async () => {
        featureToggleHandler({
          eventType: 'UPDATE',
          new: {
            id: 'test-club-id',
            progress_tracking_enabled: false
          }
        });
      });

      await waitFor(() => {
        expect(result.current.progressTrackingEnabled).toBe(false);
        expect(result.current.userProgress).toBeNull();
        expect(result.current.memberProgress).toEqual([]);
        expect(result.current.clubStats).toBeNull();
      });
    });

    it('should refetch member progress and stats on any change', async () => {
      let progressChangeHandler: Function;
      
      mockChannel.on.mockImplementation((event, config, handler) => {
        if (config.table === 'member_reading_progress') {
          progressChangeHandler = handler;
        }
        return mockChannel;
      });

      const { result } = renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      mockGetClubReadingProgress.mockClear();
      mockGetClubProgressStats.mockClear();

      // Simulate progress change from another user
      await act(async () => {
        progressChangeHandler({
          eventType: 'UPDATE',
          new: {
            user_id: 'other-user-id',
            club_id: 'test-club-id',
            status: 'finished'
          }
        });
      });

      await waitFor(() => {
        expect(mockGetClubReadingProgress).toHaveBeenCalledWith('test-user-id', 'test-club-id');
        expect(mockGetClubProgressStats).toHaveBeenCalledWith('test-club-id');
      });
    });
  });

  describe('Callback Integration', () => {
    it('should call onProgressUpdate callback', async () => {
      const onProgressUpdate = vi.fn();
      
      renderHook(() => useProgressRealtime({
        ...defaultProps,
        onProgressUpdate
      }));

      await waitFor(() => {
        expect(onProgressUpdate).toHaveBeenCalledWith(mockUserProgress);
      });
    });

    it('should call onMemberProgressUpdate callback', async () => {
      const onMemberProgressUpdate = vi.fn();
      
      renderHook(() => useProgressRealtime({
        ...defaultProps,
        onMemberProgressUpdate
      }));

      await waitFor(() => {
        expect(onMemberProgressUpdate).toHaveBeenCalledWith(mockMemberProgress);
      });
    });

    it('should call onStatsUpdate callback', async () => {
      const onStatsUpdate = vi.fn();
      
      renderHook(() => useProgressRealtime({
        ...defaultProps,
        onStatsUpdate
      }));

      await waitFor(() => {
        expect(onStatsUpdate).toHaveBeenCalledWith(mockClubStats);
      });
    });

    it('should call onFeatureToggle callback', async () => {
      const onFeatureToggle = vi.fn();
      
      renderHook(() => useProgressRealtime({
        ...defaultProps,
        onFeatureToggle
      }));

      await waitFor(() => {
        expect(onFeatureToggle).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Manual Refetch', () => {
    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useProgressRealtime(defaultProps));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      mockGetCurrentBookProgress.mockClear();
      mockGetClubReadingProgress.mockClear();
      mockGetClubProgressStats.mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetCurrentBookProgress).toHaveBeenCalled();
      expect(mockGetClubReadingProgress).toHaveBeenCalled();
      expect(mockGetClubProgressStats).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing clubId gracefully', async () => {
      const { result } = renderHook(() => useProgressRealtime({
        ...defaultProps,
        clubId: ''
      }));

      expect(result.current.loading).toBe(true);
      
      // Should not make API calls
      await waitFor(() => {
        expect(mockIsProgressTrackingEnabled).not.toHaveBeenCalled();
      });
    });

    it('should handle missing userId gracefully', async () => {
      const { result } = renderHook(() => useProgressRealtime({
        ...defaultProps,
        userId: ''
      }));

      expect(result.current.loading).toBe(true);
      
      // Should not make API calls
      await waitFor(() => {
        expect(mockIsProgressTrackingEnabled).not.toHaveBeenCalled();
      });
    });

    it('should handle rapid subscription changes', async () => {
      const { rerender } = renderHook(
        (props) => useProgressRealtime(props),
        { initialProps: defaultProps }
      );

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalledTimes(1);
      });

      // Change clubId rapidly
      rerender({ ...defaultProps, clubId: 'new-club-id' });
      rerender({ ...defaultProps, clubId: 'another-club-id' });

      await waitFor(() => {
        expect(mockChannel.unsubscribe).toHaveBeenCalled();
      });
    });
  });
});
