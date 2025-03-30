
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/services/eventService";
import { Event } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

const EventCard = ({ event }: { event: Event }) => {
  // Parse event details from description if they exist
  const getLocationFromDescription = (description: string) => {
    const locationMatch = description.match(/Location: (.*?)(?:\n|$)/);
    return locationMatch ? locationMatch[1] : null;
  };

  const getGuestsFromDescription = (description: string) => {
    const guestsMatch = description.match(/Guests: (.*?)(?:\n|$)/);
    return guestsMatch ? guestsMatch[1] : null;
  };

  const getCleanDescription = (description: string) => {
    return description
      .replace(/Location: .*?(?:\n|$)/, '')
      .replace(/Guests: .*?(?:\n|$)/, '')
      .trim();
  };

  const location = getLocationFromDescription(event.description);
  const guests = getGuestsFromDescription(event.description);
  const cleanDescription = getCleanDescription(event.description);

  // Parse date and time if possible
  const parseDateAndTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { date: dateString, time: null };
      }
      
      // Format date part
      const formattedDate = date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Format time part
      const formattedTime = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return { date: formattedDate, time: formattedTime };
    } catch (error) {
      return { date: dateString, time: null };
    }
  };

  const { date, time } = parseDateAndTime(event.date);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        <div className="p-6">
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
          
          {location && (
            <div className="flex items-center text-sm mb-2">
              <MapPin className="h-4 w-4 mr-2 text-bookconnect-terracotta" />
              <span>{location}</span>
            </div>
          )}
          
          {guests && (
            <div className="flex items-center text-sm mb-4">
              <Users className="h-4 w-4 mr-2 text-bookconnect-terracotta" />
              <span>{guests}</span>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">{cleanDescription}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const EventSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <Skeleton className="h-16 w-full" />
    </CardContent>
  </Card>
);

const Events = () => {
  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
    staleTime: 0 // This ensures fresh data each time
  });

  useEffect(() => {
    // Refetch events when the component mounts
    refetch();
    console.log("Events page mounted, refetching events");
  }, [refetch]);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8">Upcoming Events</h1>
          
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <EventSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-lg text-red-500">Failed to load events. Please try again later.</p>
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-bookconnect-cream rounded-xl">
              <h3 className="text-xl font-serif mb-2">No upcoming events</h3>
              <p className="text-muted-foreground">Check back later for new events!</p>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => refetch()} 
              className="text-bookconnect-terracotta hover:text-bookconnect-terracotta/80 underline"
            >
              Refresh events
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Events;
