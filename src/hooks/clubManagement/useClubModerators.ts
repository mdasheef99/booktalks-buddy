/**
 * Club Moderators Hook
 *
 * React hook for club moderator management and permissions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  clubManagementService,
  ClubModerator
} from '@/lib/services/clubManagementService';
import { ClubManagementAPIError } from '@/lib/api/clubManagement';

// =====================================================
// Types
// =====================================================

interface UseClubModeratorsResult {
  moderators: ClubModerator[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updatePermissions: (moderatorId: string, permissions: any) => Promise<void>;
  toggleAnalyticsAccess: (moderatorId: string, enabled: boolean) => Promise<void>;
}

// =====================================================
// Club Moderators Hook
// =====================================================

export function useClubModerators(clubId: string): UseClubModeratorsResult {
  const [moderators, setModerators] = useState<ClubModerator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchModerators = useCallback(async (useCache: boolean = true) => {
    if (!clubId || !user) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const data = await clubManagementService.getModerators(clubId, useCache);

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setModerators(data);
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error fetching club moderators:', err);
      setError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load moderators');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [clubId, user]);

  const refresh = useCallback(async () => {
    await fetchModerators(false);
  }, [fetchModerators]);

  const updatePermissions = useCallback(async (moderatorId: string, permissions: any) => {
    try {
      await clubManagementService.updateModeratorPermissions(clubId, moderatorId, permissions);
      await refresh();
    } catch (err) {
      console.error('Error updating moderator permissions:', err);
      throw err;
    }
  }, [clubId, refresh]);

  const toggleAnalyticsAccess = useCallback(async (moderatorId: string, enabled: boolean) => {
    try {
      await clubManagementService.toggleAnalyticsAccess(clubId, moderatorId, enabled);
      await refresh();
    } catch (err) {
      console.error('Error toggling analytics access:', err);
      throw err;
    }
  }, [clubId, refresh]);

  useEffect(() => {
    fetchModerators();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchModerators]);

  return {
    moderators,
    loading,
    error,
    refresh,
    updatePermissions,
    toggleAnalyticsAccess
  };
}
