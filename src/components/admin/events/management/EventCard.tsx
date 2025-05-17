import React from 'react';
import { Card } from '@/components/ui/card';
import { EventCardProps } from './types';
import EventCardHeader from './EventCardHeader';
import EventCardContent from './EventCardContent';
import EventCardFooter from './EventCardFooter';

/**
 * Component for displaying an event card
 */
const EventCard: React.FC<EventCardProps> = ({
  event,
  onViewEvent,
  onEditEvent,
  onDeleteEvent,
  onToggleFeatured,
}) => {
  return (
    <Card className="flex flex-col h-full border shadow-sm">
      <EventCardHeader
        event={event}
        onViewEvent={onViewEvent}
        onEditEvent={onEditEvent}
        onDeleteEvent={onDeleteEvent}
      />
      <EventCardContent event={event} />
      <EventCardFooter
        eventId={event.id}
        isFeatured={!!event.featured_on_landing}
        onViewEvent={onViewEvent}
        onToggleFeatured={onToggleFeatured}
      />
    </Card>
  );
};

export default EventCard;
