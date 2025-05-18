import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/lib/api/bookclubs/events';
import { subscriptionManager, ConnectionState } from '@/lib/realtime';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UseEventRealtimeOptions {
  eventId?: string;
  storeId?: string;
  clubId?: string;
  onDataChange?: (events: Event[]) => void;
  initialEvents?: Event[];
  showToasts?: boolean;
}

/**
 * Custom hook for real-time event updates
 */
export function useEventRealtime({
  eventId,
  storeId,
  clubId,
  onDataChange,
  initialEvents = [],
  showToasts = false
}: UseEventRealtimeOptions) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);

  // Handle real-time event updates
  const handleEventChange = useCallback((payload: RealtimePostgresChangesPayload<Event>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setEvents(currentEvents => {
      let updatedEvents = [...currentEvents];

      switch (eventType) {
        case 'INSERT':
          // Add new event to the list
          if (newRecord && !updatedEvents.some(e => e.id === newRecord.id)) {
            updatedEvents = [...updatedEvents, newRecord];
            if (showToasts) toast.info('New event added');
          }
          break;

        case 'UPDATE':
          // Update existing event
          if (newRecord) {
            updatedEvents = updatedEvents.map(event =>
              event.id === newRecord.id ? { ...event, ...newRecord } : event
            );
            if (showToasts) toast.info('Event updated');
          }
          break;

        case 'DELETE':
          // Remove deleted event
          if (oldRecord) {
            updatedEvents = updatedEvents.filter(event => event.id !== oldRecord.id);
            if (showToasts) toast.info('Event removed');
          }
          break;
      }

      return updatedEvents;
    });
  }, [showToasts]);

  // Set up subscription when component mounts or dependencies change
  useEffect(() => {
    // Clean up previous subscriptions
    subscriptionIds.forEach(id => subscriptionManager.unsubscribe(id));
    setSubscriptionIds([]);

    const newSubscriptionIds: string[] = [];

    // Subscribe to connection state changes
    subscriptionManager.addConnectionStateListener(setConnectionState);

    // Subscribe to specific event if eventId is provided
    if (eventId) {
      const eventSubscriptionId = subscriptionManager.subscribe({
        table: 'events',
        event: '*',
        filter: { id: eventId },
        callback: handleEventChange,
        onError: (error) => {
          console.error('Error in event subscription:', error);
          if (showToasts) toast.error('Failed to receive real-time event updates');
        },
        onReconnect: () => {
          if (showToasts) toast.success('Reconnected to event updates');
        }
      });

      newSubscriptionIds.push(eventSubscriptionId);
    }

    // Subscribe to store events if storeId is provided
    if (storeId) {
      const storeEventsSubscriptionId = subscriptionManager.subscribe({
        table: 'events',
        event: '*',
        filter: { store_id: storeId },
        callback: handleEventChange,
        onError: (error) => {
          console.error('Error in store events subscription:', error);
          if (showToasts) toast.error('Failed to receive real-time store event updates');
        },
        onReconnect: () => {
          if (showToasts) toast.success('Reconnected to store event updates');
        }
      });

      newSubscriptionIds.push(storeEventsSubscriptionId);
    }

    // Subscribe to club events if clubId is provided
    if (clubId) {
      const clubEventsSubscriptionId = subscriptionManager.subscribe({
        table: 'events',
        event: '*',
        filter: { club_id: clubId },
        callback: handleEventChange,
        onError: (error) => {
          console.error('Error in club events subscription:', error);
          if (showToasts) toast.error('Failed to receive real-time club event updates');
        },
        onReconnect: () => {
          if (showToasts) toast.success('Reconnected to club event updates');
        }
      });

      newSubscriptionIds.push(clubEventsSubscriptionId);
    }

    setSubscriptionIds(newSubscriptionIds);

    // Clean up subscriptions when component unmounts
    return () => {
      newSubscriptionIds.forEach(id => subscriptionManager.unsubscribe(id));
      subscriptionManager.removeConnectionStateListener(setConnectionState);
    };
  }, [eventId, storeId, clubId, handleEventChange, showToasts]);

  // Call onDataChange when events change
  useEffect(() => {
    if (onDataChange) {
      onDataChange(events);
    }
  }, [events, onDataChange]);

  // Optimistic update functions
  const optimisticUpdate = useCallback((updatedEvent: Partial<Event> & { id: string }) => {
    setEvents(currentEvents =>
      currentEvents.map(event =>
        event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
      )
    );
  }, []);

  const optimisticAdd = useCallback((newEvent: Event) => {
    setEvents(currentEvents => {
      if (currentEvents.some(e => e.id === newEvent.id)) {
        return currentEvents;
      }
      return [...currentEvents, newEvent];
    });
  }, []);

  const optimisticRemove = useCallback((eventId: string) => {
    setEvents(currentEvents =>
      currentEvents.filter(event => event.id !== eventId)
    );
  }, []);

  return {
    events,
    connectionState,
    isConnected: connectionState === 'CONNECTED',
    isConnecting: connectionState === 'CONNECTING',
    isDisconnected: connectionState === 'DISCONNECTED' || connectionState === 'ERROR',
    optimisticUpdate,
    optimisticAdd,
    optimisticRemove
  };
}
