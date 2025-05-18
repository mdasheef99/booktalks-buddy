import { useState, useEffect, useCallback } from 'react';
import { getEvent, Event } from '@/lib/api/bookclubs/events';
import { toast } from 'sonner';
import { useEventRealtime } from '@/hooks/useEventRealtime';
import { useParticipantsRealtime } from '@/hooks/participants';
import { LoadingStates, ErrorStates } from '../types';
import { createStandardError, ErrorType, handleError } from '@/lib/utils/error-handling';

/**
 * Hook for managing participant data and loading states
 */
export function useParticipantsData(eventId: string) {
  // State for UI controls
  const [refreshKey, setRefreshKey] = useState(0);

  // State for loading indicators
  const [loading, setLoading] = useState<LoadingStates>({
    event: true,
    participants: true,
    counts: true
  });

  // State for error handling
  const [errors, setErrors] = useState<ErrorStates>({
    event: null,
    participants: null,
    counts: null
  });

  // State for event details with proper typing
  const [event, setEvent] = useState<Event | null>(null);

  // Use event real-time hook
  useEventRealtime({
    eventId,
    initialEvents: event ? [event] : [],
    onDataChange: (events) => {
      if (events.length > 0) {
        setEvent(events[0]);
      }
    },
    showToasts: false
  });

  // Use participants real-time hook
  const { participants, counts } = useParticipantsRealtime({
    eventId,
    showToasts: false
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!eventId) return;

      setLoading({
        event: true,
        participants: true,
        counts: true
      });

      setErrors({
        event: null,
        participants: null,
        counts: null
      });

      try {
        // Fetch event details
        const eventDetails = await getEvent(eventId);
        setEvent(eventDetails);

        // Initial data loaded successfully
      } catch (error) {
        // Create a standard error with recovery action
        const standardError = createStandardError(
          ErrorType.FETCH,
          'Failed to load event details',
          'Unable to retrieve the event information. This may affect some functionality.',
          error instanceof Error ? error : undefined,
          () => loadInitialData()
        );

        // Handle the error (logs and shows toast)
        handleError(standardError, 'EventParticipantsList.loadInitialData');

        // Update component error state
        setErrors(prev => ({
          ...prev,
          event: error instanceof Error ? error : new Error(standardError.message)
        }));
      } finally {
        setLoading(prev => ({ ...prev, event: false }));
      }
    };

    loadInitialData();
  }, [eventId, refreshKey]);

  // Update loading state based on real-time connection status
  useEffect(() => {
    // Update loading state when real-time data is available
    if (participants.length > 0) {
      setLoading(prev => ({ ...prev, participants: false }));
    } else {
      // Set a timeout to stop showing loading state after a reasonable time
      // This prevents infinite loading if there are no participants
      const timer = setTimeout(() => {
        setLoading(prev => ({ ...prev, participants: false }));
      }, 3000); // 3 seconds timeout

      return () => clearTimeout(timer);
    }

    if (counts.total >= 0) {
      setLoading(prev => ({ ...prev, counts: false }));
    }
  }, [participants.length, counts.total]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    // Increment refresh key to trigger initial data load
    setRefreshKey(prev => prev + 1);

    // Reset loading states
    setLoading({
      event: true,
      participants: true,
      counts: true
    });

    // Show toast
    toast.success('Refreshing participant data...', {
      description: 'Fetching the latest participant information',
      duration: 2000
    });

    // Set a timeout to ensure loading state is cleared even if no data is returned
    setTimeout(() => {
      setLoading(prev => ({
        ...prev,
        participants: false,
        counts: false
      }));
    }, 5000); // 5 seconds timeout as a fallback
  }, []);

  // Check if all data is loading
  const isFullyLoading = loading.event && loading.participants && loading.counts;

  // Check if there are any errors
  const hasErrors = errors.event || errors.participants || errors.counts;

  return {
    event,
    participants,
    counts,
    loading,
    errors,
    isFullyLoading,
    hasErrors,
    handleRefresh
  };
}
