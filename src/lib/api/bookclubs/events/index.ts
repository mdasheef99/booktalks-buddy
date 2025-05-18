/**
 * Book Club Events Management
 * 
 * This module provides functions for managing events in the BookConnect application.
 * It is organized into logical groups:
 * 
 * - types: Type definitions for events
 * - core: Core event management functions (create, update, delete)
 * - queries: Functions for querying events
 * - images: Functions for managing event images
 * - notifications: Functions for managing event notifications
 */

// Export types
export * from './types';

// Export core event management functions
export {
  createEvent,
  updateEvent,
  deleteEvent
} from './core';

// Export event query functions
export {
  getEvent,
  getClubEvents,
  getStoreEvents,
  getFeaturedEvents,
  toggleEventFeatured
} from './queries';

// Export event image functions
export {
  uploadEventImage,
  removeEventImage
} from './images';

// Export event notification functions (if needed publicly)
// Currently, createEventNotifications is only used internally
