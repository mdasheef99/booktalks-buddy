/**
 * Utility functions for BookConnect Events
 *
 * This file contains helper functions for formatting, validation,
 * and other utility operations related to events.
 *
 * @module utils
 */

import { Event } from './types';

/**
 * Format a date for display
 * @param date - The date to format
 * @returns Formatted date string (e.g., "July 15, 2023")
 */
export function formatEventDate(date: Date | string | null | undefined): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a time for display
 * @param date - The date/time to format
 * @returns Formatted time string (e.g., "6:30 PM")
 */
export function formatEventTime(date: Date | string | null | undefined): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get a human-readable label for an event type
 * @param eventType - The event type
 * @returns Human-readable label
 */
export function getEventTypeLabel(eventType: string | null | undefined): string {
  if (!eventType) return 'Event';

  const labels: Record<string, string> = {
    'discussion': 'Discussion',
    'author_meet': 'Author Meet',
    'book_signing': 'Book Signing',
    'festival': 'Festival',
    'reading_marathon': 'Reading Marathon',
    'book_swap': 'Book Swap'
  };

  return labels[eventType] || 'Event';
}

/**
 * Check if an event is in the future
 * @param event - The event to check
 * @returns True if the event is in the future
 */
export function isEventInFuture(event: Partial<Event>): boolean {
  if (!event.start_time) return false;

  const startTime = new Date(event.start_time);
  const now = new Date();

  // Compare timestamps to avoid timezone issues
  return startTime.getTime() > now.getTime();
}

/**
 * Validate that event end time is after start time
 * @param startTime - The event start time
 * @param endTime - The event end time
 * @returns True if valid, false otherwise
 */
export function validateEventDates(
  startTime: Date | string | null | undefined,
  endTime: Date | string | null | undefined
): boolean {
  if (!startTime || !endTime) return false;

  const startDate = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const endDate = typeof endTime === 'string' ? new Date(endTime) : endTime;

  return endDate > startDate;
}

/**
 * Get relative time description for an event
 * @param event - The event
 * @returns Relative time description (e.g., "Starts in 2 days", "Ended 3 hours ago")
 */
export function getRelativeTimeDescription(event: Partial<Event>): string {
  if (!event.start_time) return '';

  const startTime = new Date(event.start_time);
  const now = new Date();

  // Event is in the past
  if (startTime < now) {
    if (event.end_time) {
      const endTime = new Date(event.end_time);
      if (endTime > now) {
        return 'In progress';
      }
    }
    return 'Ended';
  }

  // Event is in the future
  const diffMs = startTime.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `Starts in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) {
    return `Starts in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return `Starts in ${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'}`;
}
