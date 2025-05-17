import { Event } from "@/lib/api/bookclubs/events";
import { FormattedDateTime } from "../types";

/**
 * Format date and time from an event
 * @param event The event to format date and time for
 * @returns Formatted date and time information
 */
export const formatDateTime = (event: Event): FormattedDateTime => {
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
    return { date: event.date, time: null, timestamp: null };
  } catch (error) {
    console.error("Error parsing date:", error);
    return { date: event.date, time: null, timestamp: null };
  }
};
