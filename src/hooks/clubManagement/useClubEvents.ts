/**
 * Club Events Hook
 *
 * React hook for club events/meetings data and operations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  clubManagementService,
  ClubMeeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  MeetingQueryOptions,
  ClubEventNotification,
  MeetingAnalytics
} from '@/lib/services/clubManagementService';
import { ClubManagementAPIError } from '@/lib/api/clubManagement';

// =====================================================
// Types
// =====================================================

interface UseClubEventsResult {
  meetings: ClubMeeting[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createMeeting: (meetingData: CreateMeetingRequest) => Promise<ClubMeeting>;
  updateMeeting: (meetingId: string, updates: UpdateMeetingRequest) => Promise<ClubMeeting>;
  deleteMeeting: (meetingId: string) => Promise<void>;
  lastUpdated: Date | null;
}

interface UseClubMeetingAnalyticsResult {
  analytics: MeetingAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

interface UseClubEventNotificationsResult {
  notifications: ClubEventNotification[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  lastUpdated: Date | null;
}

// =====================================================
// Club Events Hook
// =====================================================

export function useClubEvents(
  clubId: string, 
  options: MeetingQueryOptions = {}
): UseClubEventsResult {
  const [meetings, setMeetings] = useState<ClubMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMeetings = useCallback(async (useCache: boolean = true) => {
    if (!clubId || !user) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const data = await clubManagementService.getMeetings(clubId, options, useCache);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setMeetings(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error fetching club meetings:', err);
      setError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load meetings');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [clubId, user, JSON.stringify(options)]);

  const refresh = useCallback(async () => {
    await fetchMeetings(false);
  }, [fetchMeetings]);

  const createMeeting = useCallback(async (meetingData: CreateMeetingRequest): Promise<ClubMeeting> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const meeting = await clubManagementService.createMeeting(clubId, meetingData, user.id);
      await refresh(); // Refresh the list
      return meeting;
    } catch (err) {
      const error = err instanceof ClubManagementAPIError ? err.message : 'Failed to create meeting';
      setError(error);
      throw err;
    }
  }, [clubId, user, refresh]);

  const updateMeeting = useCallback(async (
    meetingId: string, 
    updates: UpdateMeetingRequest
  ): Promise<ClubMeeting> => {
    try {
      const meeting = await clubManagementService.updateMeeting(clubId, meetingId, updates);
      await refresh(); // Refresh the list
      return meeting;
    } catch (err) {
      const error = err instanceof ClubManagementAPIError ? err.message : 'Failed to update meeting';
      setError(error);
      throw err;
    }
  }, [clubId, refresh]);

  const deleteMeeting = useCallback(async (meetingId: string): Promise<void> => {
    try {
      await clubManagementService.deleteMeeting(clubId, meetingId);
      await refresh(); // Refresh the list
    } catch (err) {
      const error = err instanceof ClubManagementAPIError ? err.message : 'Failed to delete meeting';
      setError(error);
      throw err;
    }
  }, [clubId, refresh]);

  // Initial fetch
  useEffect(() => {
    fetchMeetings();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMeetings]);

  return {
    meetings,
    loading,
    error,
    refresh,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    lastUpdated
  };
}

// =====================================================
// Meeting Analytics Hook
// =====================================================

export function useClubMeetingAnalytics(clubId: string): UseClubMeetingAnalyticsResult {
  const [analytics, setAnalytics] = useState<MeetingAnalytics | null>(null);
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

      const data = await clubManagementService.getMeetingAnalytics(clubId, useCache);

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

      console.error('Error fetching meeting analytics:', err);
      setError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load meeting analytics');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [clubId, user]);

  const refresh = useCallback(async () => {
    await fetchAnalytics(false);
  }, [fetchAnalytics]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();

    // Cleanup on unmount
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
// Event Notifications Hook
// =====================================================

export function useClubEventNotifications(
  clubId: string,
  dismissed: boolean = false
): UseClubEventNotificationsResult {
  const [notifications, setNotifications] = useState<ClubEventNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNotifications = useCallback(async (useCache: boolean = true) => {
    if (!clubId || !user) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const data = await clubManagementService.getEventNotifications(
        clubId, 
        user.id, 
        dismissed, 
        useCache
      );

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setNotifications(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error fetching event notifications:', err);
      setError(err instanceof ClubManagementAPIError ? err.message : 'Failed to load notifications');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [clubId, user, dismissed]);

  const refresh = useCallback(async () => {
    await fetchNotifications(false);
  }, [fetchNotifications]);

  const dismissNotification = useCallback(async (notificationId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      await clubManagementService.dismissEventNotification(clubId, notificationId, user.id);
      await refresh(); // Refresh the list
    } catch (err) {
      const error = err instanceof ClubManagementAPIError ? err.message : 'Failed to dismiss notification';
      setError(error);
      throw err;
    }
  }, [clubId, user, refresh]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    refresh,
    dismissNotification,
    lastUpdated
  };
}
