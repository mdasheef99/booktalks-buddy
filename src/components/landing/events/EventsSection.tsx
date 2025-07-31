import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getFeaturedEvents } from "@/lib/api/bookclubs/events";
import { Event } from "@/lib/api/bookclubs/events";
import { supabase } from "@/lib/supabase";
import { EventsSectionProps } from "./types";
import EventsHeader from "./EventsHeader";
import EventCarousel from "./EventCarousel";
import EventsLoadingState from "./EventsLoadingState";
import EventsErrorState from "./EventsErrorState";
import EventsEmptyState from "./EventsEmptyState";

/**
 * Events section component for the landing page
 */
const EventsSection = ({ handleEventsClick }: EventsSectionProps) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch featured events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const featuredEvents = await getFeaturedEvents();

        // Filter featured events to only show active (non-expired) ones
        const now = new Date();
        const activeFeaturedEvents = featuredEvents.filter(event => {
          const eventDate = new Date(event.start_time || event.date);
          return eventDate > now;
        });

        // If we have active featured events, use them
        if (activeFeaturedEvents.length > 0) {
          setEvents(activeFeaturedEvents);
        } else {
          // If no active featured events, get upcoming events directly from Supabase
          try {
            const nowISOString = now.toISOString();
            const { data: upcomingEvents } = await supabase
              .from('events')
              .select('*')
              .gt('start_time', nowISOString)
              .order('start_time', { ascending: true })
              .limit(6);

            setEvents(upcomingEvents || []);
          } catch (error) {
            console.error('Error fetching upcoming events:', error);
            setEvents([]);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Handle carousel navigation
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % Math.ceil(events.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + Math.ceil(events.length / 3)) % Math.ceil(events.length / 3));
  };

  // Handle view event details
  const handleViewEvent = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  // Loading state
  if (loading) {
    return <EventsLoadingState />;
  }

  // Error state
  if (error) {
    return <EventsErrorState onViewAllClick={handleEventsClick} />;
  }

  // Empty state
  if (events.length === 0) {
    return <EventsEmptyState onViewAllClick={handleEventsClick} />;
  }

  return (
    <div className="bg-bookconnect-parchment py-16 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <EventsHeader 
          title="Events" 
          description="Join literary events, author meet-ups, and book festivals happening in your community" 
        />

        <EventCarousel
          events={events}
          currentSlide={currentSlide}
          onPrevSlide={prevSlide}
          onNextSlide={nextSlide}
          onSlideChange={setCurrentSlide}
          onViewDetails={handleViewEvent}
        />

        <div className="text-center mt-8">
          <Button
            onClick={handleEventsClick}
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

export default EventsSection;
