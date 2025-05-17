import React from 'react';
import { Event } from '@/lib/supabase';
import EventCard from './EventCard';
import { Skeleton } from '@/components/ui/skeleton';

interface EventListProps {
  events: Event[];
  isLoading: boolean;
  isError: boolean;
  emptyMessage?: string;
  errorMessage?: string;
}

/**
 * Component to display a list of events
 */
const EventList: React.FC<EventListProps> = ({
  events,
  isLoading,
  isError,
  emptyMessage = 'No events found',
  errorMessage = 'Failed to load events. Please try again later.'
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <EventSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-500">{errorMessage}</p>
      </div>
    );
  }

  // Empty state
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Render events
  return (
    <div className="space-y-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

// Skeleton loader for events
export const EventSkeleton = () => (
  <div className="rounded-lg border border-border p-6 shadow-sm">
    <Skeleton className="h-6 w-3/4 mb-4" />
    <Skeleton className="h-4 w-1/2 mb-2" />
    <Skeleton className="h-4 w-1/3 mb-2" />
    <Skeleton className="h-4 w-2/3 mb-4" />
    <Skeleton className="h-16 w-full" />
  </div>
);

export default EventList;
