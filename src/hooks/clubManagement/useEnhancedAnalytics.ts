/**
 * Enhanced Analytics Hook
 *
 * React hook for enhanced analytics with trends and insights.
 * Phase 2 Week 4 implementation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ClubManagementAPIError, EnhancedAnalytics, getEnhancedAnalytics } from '@/lib/api/clubManagement';

// =====================================================
// Types
// =====================================================

interface UseEnhancedAnalyticsResult {
  analytics: EnhancedAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// =====================================================
// Enhanced Analytics Hook
// =====================================================

export function useEnhancedAnalytics(clubId: string): UseEnhancedAnalyticsResult {
  const [analytics, setAnalytics] = useState<EnhancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEnhancedAnalytics = useCallback(async () => {
    if (!clubId || !user) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const data = await getEnhancedAnalytics(clubId);

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

      console.error('Error fetching enhanced analytics:', err);
      setError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load enhanced analytics');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [clubId, user]);

  const refresh = useCallback(async () => {
    await fetchEnhancedAnalytics();
  }, [fetchEnhancedAnalytics]);

  useEffect(() => {
    fetchEnhancedAnalytics();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchEnhancedAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh,
    lastUpdated
  };
}
