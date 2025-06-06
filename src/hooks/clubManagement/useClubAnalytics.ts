/**
 * Club Analytics Hook
 *
 * React hook for basic club analytics data and operations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  clubManagementService,
  BasicClubAnalytics
} from '@/lib/services/clubManagementService';
import { ClubManagementAPIError } from '@/lib/api/clubManagement';
import { useClubModerators } from './useClubModerators';
import { useClubEvents, useClubMeetingAnalytics } from './useClubEvents';

// =====================================================
// Types
// =====================================================

interface UseClubAnalyticsResult {
  analytics: BasicClubAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// =====================================================
// Club Analytics Hook
// =====================================================

export function useClubAnalytics(clubId: string): UseClubAnalyticsResult {
  const [analytics, setAnalytics] = useState<BasicClubAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAnalytics = useCallback(async (useCache: boolean = true) => {
    if (!clubId || !user) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const data = await clubManagementService.getAnalytics(clubId, useCache);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error fetching club analytics:', err);
      setError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load analytics');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [clubId, user]);

  const refresh = useCallback(async () => {
    await fetchAnalytics(false);
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchAnalytics();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh,
    lastUpdated
  };
}

// =====================================================
// Combined Club Management Hook
// =====================================================

export function useClubManagement(clubId: string) {
  const analytics = useClubAnalytics(clubId);
  const moderators = useClubModerators(clubId);
  const events = useClubEvents(clubId, { upcoming: true }); // Default to upcoming meetings
  const meetingAnalytics = useClubMeetingAnalytics(clubId);
  const { user } = useAuth();

  const clearCache = useCallback(() => {
    clubManagementService.clearClubCache(clubId);
  }, [clubId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      analytics.refresh(),
      moderators.refresh(),
      events.refresh(),
      meetingAnalytics.refresh()
    ]);
  }, [analytics.refresh, moderators.refresh, events.refresh, meetingAnalytics.refresh]);

  const hasAnalyticsAccess = useCallback(async () => {
    if (!user) return false;
    return clubManagementService.hasAnalyticsAccess(clubId, user.id);
  }, [clubId, user]);

  return {
    analytics,
    moderators,
    events,
    meetingAnalytics,
    clearCache,
    refreshAll,
    hasAnalyticsAccess,
    loading: analytics.loading || moderators.loading || events.loading || meetingAnalytics.loading,
    error: analytics.error || moderators.error || events.error || meetingAnalytics.error
  };
}
