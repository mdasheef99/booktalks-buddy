import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Video, Building } from 'lucide-react';
import { Event } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface EventCardProps {
  event: Event;
}

/**
 * Card component for displaying event information
 */
const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();

  // Format date and time
  const formatDateTime = () => {
    try {
      // Try to parse the start_time first (new field)
      if (event.start_time) {
        const startDate = new Date(event.start_time);
        const formattedDate = startDate.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const formattedTime = startDate.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        });

        return { date: formattedDate, time: formattedTime, timestamp: startDate };
      }

      // Fall back to the date field (legacy field)
      const date = new Date(event.date);
      if (isNaN(date.getTime())) {
        return { date: event.date, time: null, timestamp: null };
      }

      const formattedDate = date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });

      return { date: formattedDate, time: formattedTime, timestamp: date };
    } catch (error) {
      console.error("Error parsing date:", error);
      return { date: event.date, time: null, timestamp: null };
    }
  };

  const { date, time, timestamp } = formatDateTime();

  // Get relative time (e.g., "2 days from now" or "3 days ago")
  const getRelativeTime = () => {
    if (!timestamp) return null;

    const now = new Date();
    const isFuture = timestamp > now;

    const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true });
    return relativeTime;
  };

  const relativeTime = getRelativeTime();

  // Get event type badge
  const getEventTypeBadge = () => {
    if (!event.event_type) return null;

    let badgeProps: { label: string; className: string } = {
      label: event.event_type.replace('_', ' '),
      className: 'bg-bookconnect-terracotta/80 text-white'
    };

    // Customize badge based on event type
    switch (event.event_type) {
      case 'discussion':
        badgeProps = { label: 'Discussion', className: 'bg-blue-500 text-white' };
        break;
      case 'author_meet':
        badgeProps = { label: 'Author Meet', className: 'bg-purple-500 text-white' };
        break;
      case 'book_signing':
        badgeProps = { label: 'Book Signing', className: 'bg-green-500 text-white' };
        break;
      case 'festival':
        badgeProps = { label: 'Festival', className: 'bg-amber-500 text-white' };
        break;
      case 'reading_marathon':
        badgeProps = { label: 'Reading Marathon', className: 'bg-red-500 text-white' };
        break;
      case 'book_swap':
        badgeProps = { label: 'Book Swap', className: 'bg-teal-500 text-white' };
        break;
    }

    return (
      <Badge className={`${badgeProps.className} mr-2`}>
        {badgeProps.label}
      </Badge>
    );
  };

  // Handle view details click
  const handleViewDetails = () => {
    navigate(`/events/${event.id}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Event Image */}
        {event.medium_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.medium_url}
              alt={event.image_alt_text || event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              {getEventTypeBadge()}
              {event.featured_on_landing && (
                <Badge className="bg-amber-500 text-white">Featured</Badge>
              )}
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Only show badges here if there's no image */}
          {!event.medium_url && (
            <div className="flex items-center mb-2">
              {getEventTypeBadge()}
              {event.featured_on_landing && (
                <Badge className="bg-amber-500 text-white">Featured</Badge>
              )}
            </div>
          )}

          <h3 className="text-xl font-serif font-bold mb-2">{event.title}</h3>

          <div className="flex items-center text-sm mb-2">
            <Calendar className="h-4 w-4 mr-2 text-bookconnect-terracotta" />
            <span>{date}</span>
            {time && (
              <>
                <Clock className="h-4 w-4 ml-4 mr-2 text-bookconnect-terracotta" />
                <span>{time}</span>
              </>
            )}
          </div>

          {relativeTime && (
            <div className="text-sm mb-2 text-bookconnect-terracotta font-medium">
              {relativeTime}
            </div>
          )}

          {event.location && (
            <div className="flex items-center text-sm mb-2">
              <MapPin className="h-4 w-4 mr-2 text-bookconnect-terracotta" />
              <span>{event.location}</span>
            </div>
          )}

          {event.is_virtual && (
            <div className="flex items-center text-sm mb-2">
              <Video className="h-4 w-4 mr-2 text-bookconnect-terracotta" />
              <span>Virtual Event</span>
            </div>
          )}

          {event.store_id && (
            <div className="flex items-center text-sm mb-2">
              <Building className="h-4 w-4 mr-2 text-bookconnect-terracotta" />
              <span>Store Event</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-4 mb-4 break-words whitespace-normal" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{event.description}</p>

          <Button
            onClick={handleViewDetails}
            variant="outline"
            className="w-full text-bookconnect-terracotta hover:bg-bookconnect-terracotta/10"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
