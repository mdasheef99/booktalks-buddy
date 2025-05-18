import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { EventCardFooterProps } from './types';
import FeaturedEventsToggle from '../FeaturedEventsToggle';

/**
 * Component for the event card footer section
 */
const EventCardFooter: React.FC<EventCardFooterProps> = ({
  eventId,
  isFeatured,
  onViewEvent,
  onToggleFeatured,
}) => {
  return (
    <CardFooter className="flex flex-wrap gap-2 justify-between items-center px-4 py-3 border-t mt-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewEvent(eventId)}
        className="flex-shrink-0 h-9 text-xs sm:text-sm"
        aria-label="View event details"
      >
        <Eye className="h-4 w-4 mr-1 sm:mr-2" />
        <span>View Details</span>
      </Button>
      <div className="flex-shrink-0">
        <FeaturedEventsToggle
          eventId={eventId}
          isFeatured={isFeatured}
          onToggle={onToggleFeatured}
        />
      </div>
    </CardFooter>
  );
};

export default EventCardFooter;
