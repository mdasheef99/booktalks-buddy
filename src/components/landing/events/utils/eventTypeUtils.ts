import { Event } from "@/lib/api/bookclubs/events";

/**
 * Get event type badge text
 * @param event The event to get the badge for
 * @returns Badge text
 */
export const getEventTypeBadge = (event: Event): string => {
  if (event.featured_on_landing) {
    return "Featured";
  }

  if (!event.event_type) {
    const now = new Date();
    const startTime = event.start_time ? new Date(event.start_time) : null;

    if (startTime && startTime > now) {
      return "Upcoming";
    }

    return "Event";
  }

  // Map event types to readable labels
  const typeLabels: Record<string, string> = {
    discussion: 'Discussion',
    author_meet: 'Author Meet',
    book_signing: 'Book Signing',
    festival: 'Festival',
    reading_marathon: 'Reading Marathon',
    book_swap: 'Book Swap',
  };

  return typeLabels[event.event_type] || 'Event';
};

/**
 * Get background color based on event type
 * @param event The event to get the background color for
 * @param index The index of the event in the list (for fallback colors)
 * @returns CSS class for background color
 */
export const getBackgroundColor = (event: Event, index: number): string => {
  if (!event.event_type) {
    const colors = [
      "bg-bookconnect-sage/20",
      "bg-bookconnect-olive/20",
      "bg-bookconnect-cream/60"
    ];
    return colors[index % 3];
  }

  const typeColors: Record<string, string> = {
    discussion: 'bg-blue-50',
    author_meet: 'bg-purple-50',
    book_signing: 'bg-green-50',
    festival: 'bg-amber-50',
    reading_marathon: 'bg-red-50',
    book_swap: 'bg-teal-50',
  };

  return typeColors[event.event_type] || 'bg-bookconnect-sage/20';
};
