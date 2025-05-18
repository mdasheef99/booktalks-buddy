import { useState, useEffect, useCallback } from 'react';
import { subscriptionManager, ConnectionState } from '@/lib/realtime/subscriptionManager';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Participant, ParticipantCounts, RsvpStatus } from '@/components/admin/events/participants/types';
import { getEventParticipants, getEventParticipantCounts } from '@/lib/api/bookclubs/participants';

interface UseParticipantsRealtimeOptions {
  eventId?: string;
  userId?: string;
  onDataChange?: (participants: Participant[]) => void;
  onCountsChange?: (counts: ParticipantCounts) => void;
  initialParticipants?: Participant[];
  initialCounts?: ParticipantCounts;
  showToasts?: boolean;
}

/**
 * Custom hook for real-time participant updates
 */
export function useParticipantsRealtime({
  eventId,
  userId,
  onDataChange,
  onCountsChange,
  initialParticipants = [],
  initialCounts = { going: 0, maybe: 0, not_going: 0, total: 0 },
  showToasts = false
}: UseParticipantsRealtimeOptions) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [counts, setCounts] = useState<ParticipantCounts>(initialCounts);
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);

  // Calculate counts from participants
  const calculateCounts = useCallback((participantsList: Participant[]): ParticipantCounts => {
    const newCounts = {
      going: 0,
      maybe: 0,
      not_going: 0,
      total: 0
    };

    participantsList.forEach(participant => {
      if (participant.rsvp_status === 'going') newCounts.going++;
      else if (participant.rsvp_status === 'maybe') newCounts.maybe++;
      else if (participant.rsvp_status === 'not_going') newCounts.not_going++;
    });

    newCounts.total = newCounts.going + newCounts.maybe + newCounts.not_going;
    return newCounts;
  }, []);

  // Handle real-time participant updates
  const handleParticipantChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setParticipants(currentParticipants => {
      let updatedParticipants = [...currentParticipants];

      switch (eventType) {
        case 'INSERT':
          // Add new participant to the list
          if (newRecord && !updatedParticipants.some(p => p.user_id === newRecord.user_id)) {
            // We need to add user details which might not be in the payload
            const newParticipant: Participant = {
              event_id: newRecord.event_id,
              user_id: newRecord.user_id,
              rsvp_status: newRecord.rsvp_status as RsvpStatus,
              rsvp_at: newRecord.rsvp_at,
              user: {
                username: newRecord.user?.username || null,
                email: newRecord.user?.email || ''
              }
            };

            updatedParticipants = [...updatedParticipants, newParticipant];
            if (showToasts) toast.info('New participant added');
          }
          break;

        case 'UPDATE':
          // Update existing participant
          if (newRecord) {
            updatedParticipants = updatedParticipants.map(participant =>
              participant.user_id === newRecord.user_id
                ? {
                    ...participant,
                    rsvp_status: newRecord.rsvp_status as RsvpStatus,
                    rsvp_at: newRecord.rsvp_at
                  }
                : participant
            );
            if (showToasts) toast.info('Participant status updated');
          }
          break;

        case 'DELETE':
          // Remove deleted participant
          if (oldRecord) {
            updatedParticipants = updatedParticipants.filter(
              participant => participant.user_id !== oldRecord.user_id
            );
            if (showToasts) toast.info('Participant removed');
          }
          break;
      }

      // Update counts
      const newCounts = calculateCounts(updatedParticipants);
      setCounts(newCounts);

      // Call onCountsChange callback
      if (onCountsChange) {
        onCountsChange(newCounts);
      }

      return updatedParticipants;
    });
  }, [calculateCounts, onCountsChange, showToasts]);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!eventId) return;

    try {
      // Fetch participants
      const fetchedParticipants = await getEventParticipants(eventId);

      // Ensure the data matches our expected type
      const typedParticipants: Participant[] = fetchedParticipants.map(p => ({
        event_id: p.event_id,
        user_id: p.user_id,
        rsvp_status: p.rsvp_status as RsvpStatus,
        rsvp_at: p.rsvp_at,
        user: {
          username: p.user?.username || null,
          email: p.user?.email || ''
        }
      }));

      setParticipants(typedParticipants);

      // Fetch counts
      const fetchedCounts = await getEventParticipantCounts(eventId);
      const total = (fetchedCounts.going || 0) + (fetchedCounts.maybe || 0) + (fetchedCounts.not_going || 0);

      setCounts({
        going: fetchedCounts.going || 0,
        maybe: fetchedCounts.maybe || 0,
        not_going: fetchedCounts.not_going || 0,
        total
      });

      if (showToasts) toast.success('Participant data loaded');
    } catch (error) {
      console.error('Error fetching initial participant data:', error);
      if (showToasts) toast.error('Failed to load participant data');
    }
  }, [eventId, showToasts]);

  // Set up subscription when component mounts or dependencies change
  useEffect(() => {
    // Clean up previous subscriptions
    subscriptionIds.forEach(id => subscriptionManager.unsubscribe(id));
    setSubscriptionIds([]);

    const newSubscriptionIds: string[] = [];

    // Subscribe to connection state changes
    subscriptionManager.addConnectionStateListener(setConnectionState);

    // Fetch initial data
    fetchInitialData();

    // Subscribe to event participants if eventId is provided
    if (eventId) {
      const participantsSubscriptionId = subscriptionManager.subscribe({
        table: 'event_participants',
        event: '*',
        filter: { event_id: eventId },
        callback: handleParticipantChange,
        onError: (error) => {
          console.error('Error in participants subscription:', error);
          if (showToasts) toast.error('Failed to receive real-time participant updates');
        },
        onReconnect: () => {
          if (showToasts) toast.success('Reconnected to participant updates');
          // Refetch data on reconnect to ensure we have the latest
          fetchInitialData();
        }
      });

      newSubscriptionIds.push(participantsSubscriptionId);
    }

    // Subscribe to user's RSVPs if userId is provided
    if (userId) {
      const userRsvpsSubscriptionId = subscriptionManager.subscribe({
        table: 'event_participants',
        event: '*',
        filter: { user_id: userId },
        callback: handleParticipantChange,
        onError: (error) => {
          console.error('Error in user RSVPs subscription:', error);
          if (showToasts) toast.error('Failed to receive real-time RSVP updates');
        },
        onReconnect: () => {
          if (showToasts) toast.success('Reconnected to RSVP updates');
          // Refetch data on reconnect to ensure we have the latest
          fetchInitialData();
        }
      });

      newSubscriptionIds.push(userRsvpsSubscriptionId);
    }

    setSubscriptionIds(newSubscriptionIds);

    // Clean up subscriptions when component unmounts
    return () => {
      newSubscriptionIds.forEach(id => subscriptionManager.unsubscribe(id));
      subscriptionManager.removeConnectionStateListener(setConnectionState);
    };
  }, [eventId, userId, handleParticipantChange, showToasts, fetchInitialData]);

  // Call onDataChange when participants change
  useEffect(() => {
    if (onDataChange) {
      onDataChange(participants);
    }
  }, [participants, onDataChange]);

  // Initialize counts from initial participants
  useEffect(() => {
    if (initialParticipants.length > 0) {
      const initialCalculatedCounts = calculateCounts(initialParticipants);
      setCounts(initialCalculatedCounts);

      if (onCountsChange) {
        onCountsChange(initialCalculatedCounts);
      }
    }
  }, [initialParticipants, calculateCounts, onCountsChange]);

  // Optimistic update functions
  const optimisticUpdateStatus = useCallback((userId: string, newStatus: RsvpStatus) => {
    setParticipants(currentParticipants => {
      const updatedParticipants = currentParticipants.map(participant =>
        participant.user_id === userId
          ? {
              ...participant,
              rsvp_status: newStatus,
              rsvp_at: new Date().toISOString()
            }
          : participant
      );

      // Update counts
      const newCounts = calculateCounts(updatedParticipants);
      setCounts(newCounts);

      // Call onCountsChange callback
      if (onCountsChange) {
        onCountsChange(newCounts);
      }

      return updatedParticipants;
    });
  }, [calculateCounts, onCountsChange]);

  const optimisticAddParticipant = useCallback((newParticipant: Participant) => {
    setParticipants(currentParticipants => {
      if (currentParticipants.some(p => p.user_id === newParticipant.user_id)) {
        return currentParticipants;
      }

      const updatedParticipants = [...currentParticipants, newParticipant];

      // Update counts
      const newCounts = calculateCounts(updatedParticipants);
      setCounts(newCounts);

      // Call onCountsChange callback
      if (onCountsChange) {
        onCountsChange(newCounts);
      }

      return updatedParticipants;
    });
  }, [calculateCounts, onCountsChange]);

  const optimisticRemoveParticipant = useCallback((userId: string) => {
    setParticipants(currentParticipants => {
      const updatedParticipants = currentParticipants.filter(
        participant => participant.user_id !== userId
      );

      // Update counts
      const newCounts = calculateCounts(updatedParticipants);
      setCounts(newCounts);

      // Call onCountsChange callback
      if (onCountsChange) {
        onCountsChange(newCounts);
      }

      return updatedParticipants;
    });
  }, [calculateCounts, onCountsChange]);

  return {
    participants,
    counts,
    connectionState,
    isConnected: connectionState === 'CONNECTED',
    isConnecting: connectionState === 'CONNECTING',
    isDisconnected: connectionState === 'DISCONNECTED' || connectionState === 'ERROR',
    optimisticUpdateStatus,
    optimisticAddParticipant,
    optimisticRemoveParticipant
  };
}
