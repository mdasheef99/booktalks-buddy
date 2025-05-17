import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { EventCardHeaderProps } from './types';
import EventTypeBadge from './EventTypeBadge';
import EventCardMenu from './EventCardMenu';

/**
 * Component for the event card header section
 */
const EventCardHeader: React.FC<EventCardHeaderProps> = ({
  event,
  onViewEvent,
  onEditEvent,
  onDeleteEvent,
}) => {
  return (
    <CardHeader className="pb-2 pt-4 px-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap gap-2 mb-2">
            <EventTypeBadge eventType={event.event_type} />
            {event.featured_on_landing && (
              <Badge className="bg-amber-100 text-amber-800 whitespace-nowrap">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl font-semibold line-clamp-2 mb-0">
            {event.title}
          </CardTitle>
        </div>
        <EventCardMenu
          eventId={event.id}
          title={event.title}
          onViewEvent={onViewEvent}
          onEditEvent={onEditEvent}
          onDeleteEvent={onDeleteEvent}
        />
      </div>
    </CardHeader>
  );
};

export default EventCardHeader;
