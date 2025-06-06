import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ReadingProgress, MemberProgressSummary, ClubProgressStats } from '@/lib/api/bookclubs/progress/types';
import {
  getClubReadingProgress,
  getClubProgressStats
} from '@/lib/api/bookclubs/progress/crud';
import { getCurrentBookProgress } from '@/lib/api/bookclubs/progress/utils';
import { isProgressTrackingEnabled } from '@/lib/api/bookclubs/progress/features';

interface UseProgressRealtimeOptions {
  clubId: string;
  userId: string;
  enabled?: boolean;
  showToasts?: boolean;
  onProgressUpdate?: (progress: ReadingProgress) => void;
  onMemberProgressUpdate?: (memberProgress: MemberProgressSummary[]) => void;
  onStatsUpdate?: (stats: ClubProgressStats) => void;
  onFeatureToggle?: (enabled: boolean) => void;
}

interface UseProgressRealtimeReturn {
  userProgress: ReadingProgress | null;
  memberProgress: MemberProgressSummary[];
  clubStats: ClubProgressStats | null;
  progressTrackingEnabled: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for real-time progress tracking updates
 * Manages subscriptions to member_reading_progress table and book_clubs progress toggle
 */
export const useProgressRealtime = ({
  clubId,
  userId,
  enabled = true,
  showToasts = true,
  onProgressUpdate,
  onMemberProgressUpdate,
  onStatsUpdate,
  onFeatureToggle
}: UseProgressRealtimeOptions): UseProgressRealtimeReturn => {
  // State management
  const [userProgress, setUserProgress] = useState<ReadingProgress | null>(null);
  const [memberProgress, setMemberProgress] = useState<MemberProgressSummary[]>([]);
  const [clubStats, setClubStats] = useState<ClubProgressStats | null>(null);
  const [progressTrackingEnabled, setProgressTrackingEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Refs for stable callback references
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const onMemberProgressUpdateRef = useRef(onMemberProgressUpdate);
  const onStatsUpdateRef = useRef(onStatsUpdate);
  const onFeatureToggleRef = useRef(onFeatureToggle);
  const subscriptionRef = useRef<any>(null);

  // Update refs when callbacks change
  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
    onMemberProgressUpdateRef.current = onMemberProgressUpdate;
    onStatsUpdateRef.current = onStatsUpdate;
    onFeatureToggleRef.current = onFeatureToggle;
  }, [onProgressUpdate, onMemberProgressUpdate, onStatsUpdate, onFeatureToggle]);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!clubId || !userId) return;

    try {
      setLoading(true);
      setError(null);

      // Check if progress tracking is enabled
      const trackingEnabled = await isProgressTrackingEnabled(clubId);
      setProgressTrackingEnabled(trackingEnabled);
      onFeatureToggleRef.current?.(trackingEnabled);

      if (trackingEnabled) {
        // Fetch user's current progress
        const userProgressData = await getCurrentBookProgress(userId, userId, clubId);
        setUserProgress(userProgressData);
        onProgressUpdateRef.current?.(userProgressData);

        // Fetch all member progress
        const memberProgressData = await getClubReadingProgress(userId, clubId);
        setMemberProgress(memberProgressData);
        onMemberProgressUpdateRef.current?.(memberProgressData);

        // Fetch club statistics
        const statsData = await getClubProgressStats(userId, clubId);
        setClubStats(statsData);
        onStatsUpdateRef.current?.(statsData);
      } else {
        // Clear data when tracking is disabled
        setUserProgress(null);
        setMemberProgress([]);
        setClubStats(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch progress data');
      setError(error);
      console.error('Error fetching initial progress data:', error);
      if (showToasts) {
        toast.error('Failed to load reading progress data');
      }
    } finally {
      setLoading(false);
    }
  }, [clubId, userId, showToasts]);

  // Handle real-time progress updates
  const handleProgressChange = useCallback(async (payload: any) => {
    try {
      console.log('Progress change detected:', payload);

      // Optimistic update for user's own progress
      if (payload.new?.user_id === userId) {
        const updatedProgress = payload.new as ReadingProgress;
        setUserProgress(updatedProgress);
        onProgressUpdateRef.current?.(updatedProgress);

        if (showToasts && payload.eventType !== 'DELETE') {
          toast.success('Your progress has been updated');
        }
      }

      // Refetch member progress and stats for all changes
      const [memberProgressData, statsData] = await Promise.all([
        getClubReadingProgress(userId, clubId),
        getClubProgressStats(userId, clubId)
      ]);

      setMemberProgress(memberProgressData);
      setClubStats(statsData);
      onMemberProgressUpdateRef.current?.(memberProgressData);
      onStatsUpdateRef.current?.(statsData);

    } catch (error) {
      console.error('Error handling progress change:', error);
      if (showToasts) {
        toast.error('Failed to update progress display');
      }
    }
  }, [clubId, userId, showToasts]);

  // Handle feature toggle changes
  const handleFeatureToggle = useCallback(async (payload: any) => {
    try {
      console.log('Feature toggle change detected:', payload);
      
      if (payload.new?.id === clubId) {
        const enabled = payload.new?.progress_tracking_enabled || false;
        setProgressTrackingEnabled(enabled);
        onFeatureToggleRef.current?.(enabled);

        if (!enabled) {
          // Clear progress data when feature is disabled
          setUserProgress(null);
          setMemberProgress([]);
          setClubStats(null);
          
          if (showToasts) {
            toast.info('Reading progress tracking has been disabled for this club');
          }
        } else {
          // Refetch data when feature is enabled
          await fetchInitialData();
          
          if (showToasts) {
            toast.success('Reading progress tracking has been enabled for this club');
          }
        }
      }
    } catch (error) {
      console.error('Error handling feature toggle:', error);
      if (showToasts) {
        toast.error('Failed to update progress tracking status');
      }
    }
  }, [clubId, showToasts, fetchInitialData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enabled || !clubId || !userId) {
      return;
    }

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Create new subscription
    const subscription = supabase
      .channel(`club_progress_${clubId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_reading_progress',
          filter: `club_id=eq.${clubId}`
        },
        handleProgressChange
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'book_clubs',
          filter: `id=eq.${clubId}`
        },
        handleFeatureToggle
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to progress updates for club ${clubId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Channel error for club progress ${clubId}`);
          setError(new Error('Real-time connection error'));
          if (showToasts) {
            toast.error('Lost connection to real-time updates');
          }
        } else if (status === 'TIMED_OUT') {
          console.error(`Subscription timed out for club progress ${clubId}`);
          setError(new Error('Real-time connection timed out'));
          if (showToasts) {
            toast.error('Real-time connection timed out');
          }
        }
      });

    subscriptionRef.current = subscription;

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [enabled, clubId, userId, handleProgressChange, handleFeatureToggle, showToasts]);

  // Fetch initial data on mount
  useEffect(() => {
    if (enabled) {
      fetchInitialData();
    }
  }, [enabled, fetchInitialData]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  return {
    userProgress,
    memberProgress,
    clubStats,
    progressTrackingEnabled,
    loading,
    error,
    refetch
  };
};
