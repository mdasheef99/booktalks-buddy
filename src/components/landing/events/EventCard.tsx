import { Calendar, MapPin, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCardProps } from "./types";
import { formatDateTime, getBackgroundColor, getEventTypeBadge } from "./utils";

/**
 * Event card component for displaying a single event
 */
const EventCard = ({ event, index, onViewDetails }: EventCardProps) => {
  const { date, time } = formatDateTime(event);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
      <div className={`h-48 relative overflow-hidden`}>
        {event.medium_url ? (
          <>
            <img
              src={event.medium_url}
              alt={event.image_alt_text || event.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bookconnect-brown/40"></div>
          </>
        ) : (
          <div className={`h-full w-full ${getBackgroundColor(event, index)}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bookconnect-brown/30"></div>
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <div className="bg-bookconnect-terracotta text-white px-3 py-1 rounded-full text-sm font-medium">
            {getEventTypeBadge(event)}
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-serif text-xl font-semibold mb-2 text-bookconnect-brown line-clamp-2">
          {event.title}
        </h3>
        <div className="flex items-center text-bookconnect-brown/70 mb-2">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm truncate">{date}</span>
        </div>
        {time && (
          <div className="flex items-center text-bookconnect-brown/70 mb-2">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm">{time}</span>
          </div>
        )}
        <div className="flex items-center text-bookconnect-brown/70 mb-4">
          {event.is_virtual ? (
            <>
              <Video className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">Virtual Event</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm truncate">{event.location || 'Location TBD'}</span>
            </>
          )}
        </div>
        <p className="text-bookconnect-brown/80 text-sm mb-4 line-clamp-3 break-words whitespace-normal" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {event.description}
        </p>
        <Button
          onClick={() => onViewDetails(event.id)}
          variant="outline"
          className="w-full border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-terracotta hover:text-white hover:border-bookconnect-terracotta transition-all duration-300"
        >
          View Details
        </Button>
      </div>
    </div>
  );
};

export default EventCard;
