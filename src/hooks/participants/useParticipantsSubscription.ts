import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { subscriptionManager, ConnectionState } from '@/lib/realtime';
import { UseParticipantsSubscriptionOptions, UseParticipantsSubscriptionResult } from './types';

/**
 * Hook for managing participant subscriptions
 */
export function useParticipantsSubscription({
  eventId,
  userId,
  showToasts = false,
  handleParticipantChange,
  fetchInitialData
}: UseParticipantsSubscriptionOptions): UseParticipantsSubscriptionResult {
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);

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

  return {
    connectionState,
    isConnected: connectionState === 'CONNECTED',
    isConnecting: connectionState === 'CONNECTING',
    isDisconnected: connectionState === 'DISCONNECTED' || connectionState === 'ERROR'
  };
}
