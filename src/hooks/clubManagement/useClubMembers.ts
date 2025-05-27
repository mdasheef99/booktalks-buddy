/**
 * Club Members Hook
 *
 * React hook for fetching and managing club member data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  clubManagementService,
  ClubMember
} from '@/lib/services/clubManagementService';
import { ClubManagementAPIError } from '@/lib/api/clubManagement';

// =====================================================
// Types
// =====================================================

interface UseClubMembersResult {
  members: ClubMember[];
  eligibleMembers: ClubMember[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  searchMembers: (query: string) => ClubMember[];
}

// =====================================================
// Club Members Hook
// =====================================================

export function useClubMembers(clubId: string): UseClubMembersResult {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [eligibleMembers, setEligibleMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMembers = useCallback(async (useCache: boolean = true) => {
    if (!clubId || !user) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Fetch all members and eligible members in parallel
      const [allMembers, eligibleMembersData] = await Promise.all([
        clubManagementService.getClubMembers(clubId, useCache),
        clubManagementService.getEligibleMembers(clubId)
      ]);

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setMembers(allMembers);
      setEligibleMembers(eligibleMembersData);
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error fetching club members:', err);
      setError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load club members');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [clubId, user]);

  const refresh = useCallback(async () => {
    await fetchMembers(false);
  }, [fetchMembers]);

  const searchMembers = useCallback((query: string): ClubMember[] => {
    if (!query.trim()) {
      return eligibleMembers;
    }

    const searchTerm = query.toLowerCase();
    return eligibleMembers.filter(member => 
      member.username.toLowerCase().includes(searchTerm) ||
      member.display_name.toLowerCase().includes(searchTerm)
    );
  }, [eligibleMembers]);

  useEffect(() => {
    fetchMembers();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMembers]);

  return {
    members,
    eligibleMembers,
    loading,
    error,
    refresh,
    searchMembers
  };
}
