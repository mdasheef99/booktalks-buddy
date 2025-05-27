/**
 * Analytics History Hook
 *
 * React hook for club analytics historical data and snapshots.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  clubManagementService,
  ClubAnalyticsSnapshot
} from '@/lib/services/clubManagementService';
import { ClubManagementAPIError } from '@/lib/api/clubManagement';

// =====================================================
// Types
// =====================================================

interface UseClubAnalyticsHistoryResult {
  snapshots: ClubAnalyticsSnapshot[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createSnapshot: () => Promise<void>;
}

// =====================================================
// Club Analytics History Hook
// =====================================================

export function useClubAnalyticsHistory(
  clubId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 30
): UseClubAnalyticsHistoryResult {
  const [snapshots, setSnapshots] = useState<ClubAnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!clubId || !user) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const data = await clubManagementService.getAnalyticsHistory(clubId, startDate, endDate, limit);

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setSnapshots(data);
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error fetching analytics history:', err);
      setError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load analytics history');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [clubId, user, startDate, endDate, limit]);

  const refresh = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  const createSnapshot = useCallback(async () => {
    try {
      await clubManagementService.createSnapshot(clubId);
      await refresh();
    } catch (err) {
      console.error('Error creating snapshot:', err);
      throw err;
    }
  }, [clubId, refresh]);

  useEffect(() => {
    fetchHistory();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchHistory]);

  return {
    snapshots,
    loading,
    error,
    refresh,
    createSnapshot
  };
}
