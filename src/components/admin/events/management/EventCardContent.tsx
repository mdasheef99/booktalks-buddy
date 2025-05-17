import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { EventCardContentProps } from './types';
import { formatDate, formatTime } from './utils';

/**
 * Component for the event card content section
 */
const EventCardContent: React.FC<EventCardContentProps> = ({ event }) => {
  return (
    <CardContent className="flex-grow px-4 pb-2">
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{formatDate(event.start_time || event.date)}</span>
        </div>
        {event.start_time && (
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              {formatTime(event.start_time)}
              {event.end_time && ` - ${formatTime(event.end_time)}`}
            </span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              {event.location}
              {event.is_virtual && " (Virtual)"}
            </span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-700 line-clamp-2 min-h-[40px]">
        {event.description || "No description provided."}
      </p>
    </CardContent>
  );
};

export default EventCardContent;
