import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventCarouselProps } from "./types";
import EventCard from "./EventCard";

/**
 * Carousel component for displaying events
 */
const EventCarousel = ({
  events,
  currentSlide,
  onPrevSlide,
  onNextSlide,
  onSlideChange,
  onViewDetails
}: EventCarouselProps) => {
  // Get current slide events (3 per slide)
  const currentEvents = events.slice(currentSlide * 3, (currentSlide + 1) * 3);
  const totalSlides = Math.ceil(events.length / 3);

  return (
    <div className="relative">
      {events.length > 3 && (
        <>
          <button
            onClick={onPrevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
            aria-label="Previous events"
          >
            <ChevronLeft className="h-5 w-5 text-bookconnect-brown" />
          </button>
          <button
            onClick={onNextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
            aria-label="Next events"
          >
            <ChevronRight className="h-5 w-5 text-bookconnect-brown" />
          </button>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {currentEvents.map((event, index) => (
          <EventCard 
            key={event.id} 
            event={event} 
            index={index} 
            onViewDetails={onViewDetails} 
          />
        ))}

        {/* Fill in empty slots with placeholder if needed */}
        {currentEvents.length < 3 && Array.from({ length: 3 - currentEvents.length }).map((_, i) => (
          <div key={`empty-${i}`} className="hidden md:block"></div>
        ))}
      </div>

      {/* Carousel indicators */}
      {events.length > 3 && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => onSlideChange(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide ? 'w-8 bg-bookconnect-terracotta' : 'w-2 bg-bookconnect-brown/30'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventCarousel;
