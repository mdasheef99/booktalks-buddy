import { useCallback } from 'react';
import { Participant, ParticipantCounts, RsvpStatus } from '@/components/admin/events/participants/types';
import { UseParticipantsOptimisticUpdatesOptions, UseParticipantsOptimisticUpdatesResult } from './types';

/**
 * Hook for managing optimistic updates to participants
 */
export function useParticipantsOptimisticUpdates({
  setParticipants,
  setCounts,
  onCountsChange
}: UseParticipantsOptimisticUpdatesOptions): UseParticipantsOptimisticUpdatesResult {
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
  }, [calculateCounts, onCountsChange, setCounts]);

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
  }, [calculateCounts, onCountsChange, setCounts]);

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
  }, [calculateCounts, onCountsChange, setCounts]);

  return {
    optimisticUpdateStatus,
    optimisticAddParticipant,
    optimisticRemoveParticipant,
    calculateCounts
  };
}
