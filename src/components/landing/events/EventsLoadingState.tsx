import { Skeleton } from "@/components/ui/skeleton";
import { EventsLoadingStateProps } from "./types";
import EventsHeader from "./EventsHeader";

/**
 * Loading state component for the events section
 */
const EventsLoadingState = ({}: EventsLoadingStateProps) => {
  return (
    <div className="bg-bookconnect-parchment py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <EventsHeader 
          title="Events" 
          description="Join literary events, author meet-ups, and book festivals happening in your community" 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventsLoadingState;
