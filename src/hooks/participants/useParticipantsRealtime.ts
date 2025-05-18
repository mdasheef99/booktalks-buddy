import { useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Participant, RsvpStatus } from '@/components/admin/events/participants/types';
import { useParticipantsData } from './useParticipantsData';
import { useParticipantsSubscription } from './useParticipantsSubscription';
import { useParticipantsOptimisticUpdates } from './useParticipantsOptimisticUpdates';
import { UseParticipantsRealtimeOptions, UseParticipantsRealtimeResult } from './types';

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
}: UseParticipantsRealtimeOptions): UseParticipantsRealtimeResult {
  // Use the data hook
  const {
    participants,
    setParticipants,
    counts,
    setCounts,
    fetchInitialData
  } = useParticipantsData({
    eventId,
    showToasts,
    initialParticipants,
    initialCounts,
    onDataChange,
    onCountsChange
  });

  // Use the optimistic updates hook
  const {
    optimisticUpdateStatus,
    optimisticAddParticipant,
    optimisticRemoveParticipant,
    calculateCounts
  } = useParticipantsOptimisticUpdates({
    setParticipants,
    setCounts,
    onCountsChange
  });

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
  }, [calculateCounts, onCountsChange, setCounts, showToasts]);

  // Use the subscription hook
  const { connectionState, isConnected, isConnecting, isDisconnected } = useParticipantsSubscription({
    eventId,
    userId,
    showToasts,
    handleParticipantChange,
    fetchInitialData
  });

  return {
    participants,
    counts,
    connectionState,
    isConnected,
    isConnecting,
    isDisconnected,
    optimisticUpdateStatus,
    optimisticAddParticipant,
    optimisticRemoveParticipant
  };
}
