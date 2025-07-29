import { Button } from "@/components/ui/button";
import { EventsEmptyStateProps } from "./types";
import EventsHeader from "./EventsHeader";

/**
 * Empty state component for the events section
 */
const EventsEmptyState = ({ onViewAllClick }: EventsEmptyStateProps) => {
  return (
    <div className="bg-bookconnect-parchment py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <EventsHeader 
          title="Events" 
          description="Join literary events, author meet-ups, and book festivals happening in your community" 
        />

        <div className="text-center py-12">
          <p className="text-bookconnect-brown/80 mb-4">
            Stay tuned for future events
          </p>
          <Button
            onClick={onViewAllClick}
            variant="outline"
            className="border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-terracotta hover:text-white hover:border-bookconnect-terracotta transition-all duration-300"
          >
            View All Events
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventsEmptyState;
