import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Participant, ParticipantCounts, RsvpStatus } from '@/components/admin/events/participants/types';
import { getEventParticipants, getEventParticipantCounts } from '@/lib/api/bookclubs/participants';
import { UseParticipantsDataOptions, UseParticipantsDataResult } from './types';

/**
 * Hook for managing participant data
 */
export function useParticipantsData({
  eventId,
  showToasts = false,
  initialParticipants = [],
  initialCounts = { going: 0, maybe: 0, not_going: 0, total: 0 },
  onDataChange,
  onCountsChange
}: UseParticipantsDataOptions): UseParticipantsDataResult {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [counts, setCounts] = useState<ParticipantCounts>(initialCounts);

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

  // Call onDataChange when participants change
  useEffect(() => {
    if (onDataChange) {
      onDataChange(participants);
    }
  }, [participants, onDataChange]);

  // Call onCountsChange when counts change
  useEffect(() => {
    if (onCountsChange) {
      onCountsChange(counts);
    }
  }, [counts, onCountsChange]);

  // Initialize counts from initial participants
  useEffect(() => {
    if (initialParticipants.length > 0) {
      const initialCalculatedCounts = calculateCounts(initialParticipants);
      setCounts(initialCalculatedCounts);
    }
  }, [initialParticipants, calculateCounts]);

  return {
    participants,
    setParticipants,
    counts,
    setCounts,
    fetchInitialData
  };
}
