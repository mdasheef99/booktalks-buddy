/**
 * Club Event RSVP Hook
 *
 * React hook for managing RSVP functionality for club meetings.
 * Provides RSVP status management, statistics, and real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  clubEventsService,
  ClubMeetingRSVP,
  MeetingRSVPStats,
  RSVPStatus,
  ClubManagementAPIError
} from '@/lib/services/clubManagementService';

// =====================================================
// Types
// =====================================================

interface UseClubEventRSVPResult {
  // User's RSVP state
  userRSVP: ClubMeetingRSVP | null;
  rsvpLoading: boolean;
  rsvpError: string | null;
  
  // RSVP statistics
  rsvpStats: MeetingRSVPStats | null;
  statsLoading: boolean;
  statsError: string | null;
  
  // Actions
  updateRSVP: (status: RSVPStatus) => Promise<void>;
  removeRSVP: () => Promise<void>;
  refreshRSVP: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Utility
  hasRSVP: boolean;
  canRSVP: boolean;
}

// =====================================================
// Hook Implementation
// =====================================================

export function useClubEventRSVP(
  meetingId: string,
  clubId: string,
  isMember: boolean = false
): UseClubEventRSVPResult {
  const { user } = useAuth();
  
  // User RSVP state
  const [userRSVP, setUserRSVP] = useState<ClubMeetingRSVP | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  
  // RSVP statistics state
  const [rsvpStats, setRsvpStats] = useState<MeetingRSVPStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // =====================================================
  // Data Fetching
  // =====================================================

  const fetchUserRSVP = useCallback(async (useCache: boolean = true) => {
    if (!meetingId || !user?.id || !isMember) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setRsvpLoading(true);
      setRsvpError(null);

      const rsvp = await clubEventsService.getUserRSVP(meetingId, user.id, useCache);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setUserRSVP(rsvp);
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error fetching user RSVP:', err);
      setRsvpError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load RSVP');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setRsvpLoading(false);
      }
    }
  }, [meetingId, user?.id, isMember]);

  const fetchRSVPStats = useCallback(async (useCache: boolean = true) => {
    if (!meetingId || !isMember) return;

    try {
      setStatsLoading(true);
      setStatsError(null);

      const stats = await clubEventsService.getMeetingRSVPStats(meetingId, useCache);
      setRsvpStats(stats);
    } catch (err) {
      console.error('Error fetching RSVP stats:', err);
      setStatsError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load RSVP statistics');
    } finally {
      setStatsLoading(false);
    }
  }, [meetingId, isMember]);

  // =====================================================
  // RSVP Actions
  // =====================================================

  const updateRSVP = useCallback(async (status: RSVPStatus) => {
    if (!meetingId || !clubId || !user?.id || !isMember) {
      throw new Error('Cannot RSVP: missing required data or not a club member');
    }

    try {
      setRsvpLoading(true);
      setRsvpError(null);

      const updatedRSVP = await clubEventsService.upsertRSVP(
        meetingId,
        clubId,
        user.id,
        status
      );

      setUserRSVP(updatedRSVP);
      
      // Refresh stats to reflect the change
      await fetchRSVPStats(false);
    } catch (err) {
      console.error('Error updating RSVP:', err);
      setRsvpError(err instanceof ClubManagementAPIError ? err.message : 'Failed to update RSVP');
      throw err;
    } finally {
      setRsvpLoading(false);
    }
  }, [meetingId, clubId, user?.id, isMember, fetchRSVPStats]);

  const removeRSVP = useCallback(async () => {
    if (!meetingId || !clubId || !user?.id || !userRSVP) {
      throw new Error('Cannot remove RSVP: no existing RSVP found');
    }

    try {
      setRsvpLoading(true);
      setRsvpError(null);

      await clubEventsService.deleteRSVP(meetingId, user.id, clubId);
      setUserRSVP(null);
      
      // Refresh stats to reflect the change
      await fetchRSVPStats(false);
    } catch (err) {
      console.error('Error removing RSVP:', err);
      setRsvpError(err instanceof ClubManagementAPIError ? err.message : 'Failed to remove RSVP');
      throw err;
    } finally {
      setRsvpLoading(false);
    }
  }, [meetingId, clubId, user?.id, userRSVP, fetchRSVPStats]);

  const refreshRSVP = useCallback(async () => {
    await fetchUserRSVP(false);
  }, [fetchUserRSVP]);

  const refreshStats = useCallback(async () => {
    await fetchRSVPStats(false);
  }, [fetchRSVPStats]);

  // =====================================================
  // Effects
  // =====================================================

  // Initial data fetch
  useEffect(() => {
    if (meetingId && isMember) {
      fetchUserRSVP();
      fetchRSVPStats();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [meetingId, isMember, fetchUserRSVP, fetchRSVPStats]);

  // =====================================================
  // Computed Values
  // =====================================================

  const hasRSVP = userRSVP !== null;
  const canRSVP = isMember && user?.id && meetingId && clubId;

  return {
    // User's RSVP state
    userRSVP,
    rsvpLoading,
    rsvpError,
    
    // RSVP statistics
    rsvpStats,
    statsLoading,
    statsError,
    
    // Actions
    updateRSVP,
    removeRSVP,
    refreshRSVP,
    refreshStats,
    
    // Utility
    hasRSVP,
    canRSVP: !!canRSVP
  };
}

export default useClubEventRSVP;
