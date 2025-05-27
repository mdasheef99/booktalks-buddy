/**
 * Analytics Access Hooks
 *
 * React hooks for checking and managing analytics access permissions.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  clubManagementService,
  BasicClubAnalytics
} from '@/lib/services/clubManagementService';

// =====================================================
// Analytics Access Hook
// =====================================================

/**
 * Hook for checking analytics access
 */
export function useAnalyticsAccess(clubId: string) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function checkAccess() {
      if (!user || !clubId) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const access = await clubManagementService.hasAnalyticsAccess(clubId, user.id);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking analytics access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [clubId, user]);

  return { hasAccess, loading };
}

// =====================================================
// Safe Analytics Hook
// =====================================================

/**
 * Hook for safe analytics fetching
 */
export function useAnalyticsSafe(clubId: string) {
  const [analytics, setAnalytics] = useState<BasicClubAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSafe() {
      if (!clubId) return;

      try {
        setLoading(true);
        const data = await clubManagementService.getAnalyticsSafe(clubId);
        setAnalytics(data);
      } catch (error) {
        console.error('Safe analytics fetch failed:', error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSafe();
  }, [clubId]);

  return { analytics, loading };
}
