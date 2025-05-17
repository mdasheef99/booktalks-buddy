# BookClub Events Feature Implementation

## Overview

The Events feature enhancement will allow store owners to create and manage events for book clubs, providing registered members with information about upcoming activities. The feature will include notification badges for unread events in the BookClub side panel and a dedicated Events section in the admin panel for store owners. Selected events can also be featured on the landing page.

## Current State

- There is an existing `events` table with basic fields: id, title, date, description, created_at
- There's an existing Events page (`src/pages/Events.tsx`) and service (`src/services/eventService.ts`)
- The landing page has an `EventsSection` component that displays static event information
- There's an Events section in the main navigation sidebar
- Store owners and managers have the `CAN_MANAGE_STORE_EVENTS` entitlement

## Requirements

1. **BookClub Events Section Enhancement**:
   - Add notification badges to show unread events count in the existing Events section
   - Implement a notification system for new events

2. **Admin Panel Events Section**:
   - Create a dedicated "Events" section in the admin panel's side navigation for store owners
   - Allow store owners to add, edit, and manage events from their admin interface

3. **Landing Page Integration**:
   - Allow store owners to feature selected events on the landing page
   - Update the landing page to display dynamic event data from the database

## Database Schema Enhancement

### Extend the existing `events` table:

```sql
-- Alter the events table to add BookClub-specific fields
ALTER TABLE events
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES book_clubs(id),
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id),
ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('discussion', 'author_meet', 'book_signing', 'festival', 'reading_marathon', 'book_swap')),
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS virtual_meeting_link TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER,
ADD COLUMN IF NOT EXISTS featured_on_landing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
```

### Create new tables for event participants and notifications:

```sql
-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rsvp_status TEXT CHECK (rsvp_status IN ('going', 'maybe', 'not_going')),
    rsvp_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (event_id, user_id)
);

-- Create event_notifications table for tracking unread events
CREATE TABLE IF NOT EXISTS event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (event_id, user_id)
);
```

## API Implementation

### Event Management API

The Event Management API will handle all operations related to events:

1. **Event CRUD Operations**:
   - `createEvent`: Create a new event (requires CAN_MANAGE_STORE_EVENTS entitlement)
   - `updateEvent`: Update an existing event (requires CAN_MANAGE_STORE_EVENTS entitlement)
   - `deleteEvent`: Delete an event (requires CAN_MANAGE_STORE_EVENTS entitlement)
   - `getEvent`: Get details of a specific event
   - `getClubEvents`: Get all events for a specific club
   - `getStoreEvents`: Get all events for a specific store (requires store owner/manager entitlement)

2. **Event Feature Management**:
   - `getFeaturedEvents`: Get events featured on the landing page
   - `toggleEventFeatured`: Toggle whether an event is featured on the landing page

### Participant Management API

The Participant Management API will handle operations related to event participation:

1. **RSVP Operations**:
   - `rsvpToEvent`: RSVP to an event (requires club membership)
   - `getEventParticipants`: Get all participants for an event
   - `cancelRsvp`: Cancel an RSVP

### Notification Management API

The Notification Management API will handle operations related to event notifications:

1. **Notification Operations**:
   - `getUnreadEventNotifications`: Get unread event notifications for a user
   - `markEventNotificationAsRead`: Mark an event notification as read
   - `markAllEventNotificationsAsRead`: Mark all event notifications as read
   - `createEventNotifications`: Create notifications for all club members when a new event is created

## UI Components Implementation

### BookClub Events Section Enhancement

1. **Events Navigation Enhancement**:
   - Add a notification badge to the existing Events navigation item in the sidebar
   - The badge should display the count of unread event notifications

2. **Events List Page Enhancement**:
   - Update the existing Events page to display events relevant to the user
   - Add filtering options for club-specific events
   - Implement real-time updates for new events

3. **Event Details Page Enhancement**:
   - Enhance the event details page to display all event information
   - Add RSVP functionality
   - Show the list of participants
   - Implement sharing options

### Admin Panel Events Section

1. **Admin Navigation Enhancement**:
   - Add an Events section to the admin panel sidebar
   - This section should only be visible to users with the CAN_MANAGE_STORE_EVENTS entitlement

2. **Admin Events List Page**:
   - Create a page to display all events for the store
   - Include filtering and sorting options
   - Show event statistics (participation rates, etc.)

3. **Event Creation/Editing Form**:
   - Create a form for adding new events
   - Include fields for all event properties
   - Add validation for required fields
   - Include an option to feature the event on the landing page

4. **Event Participants Management**:
   - Create a page to view and manage event participants
   - Allow exporting participant lists
   - Implement communication options (e.g., send email to all participants)

### Landing Page Integration

1. **Featured Events Section**:
   - Update the existing EventsSection component to fetch and display real events
   - Prioritize events that are marked as featured_on_landing
   - Implement a carousel for multiple featured events

## Row Level Security (RLS) Policies

Implement RLS policies to ensure proper access control:

1. **Events Table Policies**:
   - Anyone can view events
   - Only store owners/managers can create events
   - Only event creator or store owner/manager can update/delete events

2. **Event Participants Table Policies**:
   - Anyone can view event participants
   - Users can only RSVP for themselves
   - Users can only update/delete their own RSVPs

3. **Event Notifications Table Policies**:
   - Users can only view their own notifications
   - System can insert notifications for any user
   - Users can only update/delete their own notifications

## User Flows

### Store Owner Flow

1. Store owner logs into the admin panel
2. Navigates to the Events section
3. Creates a new event with all details
4. Optionally marks the event to be featured on the landing page
5. Views and manages event participants
6. Edits or deletes events as needed

### Club Member Flow

1. Member logs into the application
2. Sees notification badge on the Events navigation item
3. Clicks on Events to view all events
4. Views event details
5. RSVPs to events of interest
6. Receives notifications for new events in clubs they're members of

## Implementation Phases

### Phase 1: Database Schema and API Implementation (COMPLETED)

1. ✅ Create database migration file to enhance the events table and create new tables
   - Created `supabase/migrations/20250610_enhance_events_tables.sql`
   - Enhanced the existing `events` table with additional fields
   - Created new tables for `event_participants` and `event_notifications`
   - Implemented RLS policies for security

2. ✅ Implement API functions for event management
   - Created `src/lib/api/bookclubs/events.ts` with the following functions:
     - `createEvent`: Create a new event with permission checks
     - `updateEvent`: Update an existing event with permission checks
     - `deleteEvent`: Delete an event with permission checks
     - `getEvent`: Get details of a specific event
     - `getClubEvents`: Get all events for a specific club
     - `getStoreEvents`: Get all events for a specific store
     - `getFeaturedEvents`: Get events featured on the landing page
     - `toggleEventFeatured`: Toggle whether an event is featured

3. ✅ Implement API functions for participant management
   - Created `src/lib/api/bookclubs/participants.ts` with the following functions:
     - `rsvpToEvent`: RSVP to an event with membership checks
     - `cancelRsvp`: Cancel an RSVP
     - `getEventParticipants`: Get all participants for an event
     - `getUserRsvpStatus`: Get a user's RSVP status for an event
     - `getUserRsvpEvents`: Get all events a user has RSVPed to
     - `getEventParticipantCounts`: Get counts of participants by RSVP status

4. ✅ Implement API functions for notification management
   - Created `src/lib/api/bookclubs/notifications.ts` with the following functions:
     - `getUnreadEventNotifications`: Get unread notifications for a user
     - `getAllEventNotifications`: Get all notifications for a user
     - `markEventNotificationAsRead`: Mark a notification as read
     - `markAllEventNotificationsAsRead`: Mark all notifications as read
     - `getUnreadEventNotificationsCount`: Get the count of unread notifications
     - `createEventNotification`: Create a notification for a user
     - `deleteEventNotification`: Delete a notification
     - `subscribeToEventNotifications`: Subscribe to real-time updates

5. ✅ Update database types and API exports
   - Updated `src/lib/database.types.ts` and `src/integrations/supabase/types.ts`
   - Updated API index files to export the new functions

### Phase 2: BookClub Events UI Enhancement (COMPLETED)

1. ✅ Update the Events navigation item to include notification badge
   - Created `src/components/events/NotificationBadge.tsx` for displaying unread counts
   - Created `src/hooks/useEventNotifications.ts` to fetch and track notifications
   - Created `src/components/events/EventsNavItem.tsx` to integrate with navigation
   - Updated `src/components/navigation/MainNavigation.tsx` to use the new component

2. ✅ Enhance the Events list page to display relevant events
   - Created `src/components/events/EventList.tsx` for displaying events
   - Created `src/components/events/EventCard.tsx` for event information
   - Created `src/hooks/useEvents.ts` for fetching and filtering events
   - Created `src/components/events/EventFilters.tsx` for filtering options
   - Updated `src/pages/Events.tsx` to use the new components

3. ✅ Enhance the Event details page with RSVP functionality
   - Created `src/components/events/RsvpButton.tsx` for RSVPing to events
   - Created `src/components/events/ParticipantsList.tsx` for displaying participants
   - Created `src/pages/EventDetailsPage.tsx` for viewing event details
   - Updated `src/App.tsx` to include the new route

4. ✅ Implement real-time updates for new events
   - Used Supabase's real-time features for event updates
   - Implemented real-time subscription for notifications
   - Added automatic refresh functionality

### Phase 3: Admin Events UI Implementation (IN PROGRESS)

1. ✅ Update Admin navigation to include Events section
   - Added an Events item to the admin sidebar in `src/components/layouts/AdminLayout.tsx`
   - Made it visible only to users with the CAN_MANAGE_STORE_EVENTS entitlement

2. ✅ Implement event management list page
   - Created `src/pages/admin/AdminEventsPage.tsx` for managing events
   - Implemented filtering, sorting, and search functionality
   - Added options to create, edit, and delete events
   - Implemented statistics cards for total, upcoming, and featured events
   - Added development mode with mock data for testing without permissions

3. ✅ Implement event creation/editing form
   - Created `src/components/admin/events/EventForm.tsx` for event details
   - Created form sections for better organization:
     - `BasicInfoSection.tsx`: Title, description, event type, and club selection
     - `DateTimeSection.tsx`: Start/end date and time selection
     - `LocationSection.tsx`: Physical/virtual location details
     - `AdditionalSettingsSection.tsx`: Max participants and featured status
   - Added validation for required fields
   - Implemented option to feature events on the landing page

4. ✅ Implement event card layout with consistent design
   - Created `src/components/admin/events/EventManagementList.tsx` with responsive grid layout
   - Implemented consistent card heights with flex layout
   - Added proper text truncation and overflow handling
   - Ensured consistent button sizing and alignment
   - Added visual indicators for event types and featured status

5. ✅ Implement featured events toggle
   - Created `src/components/admin/events/FeaturedEventsToggle.tsx`
   - Added tooltip for better usability
   - Implemented visual feedback for featured status
   - Added permission handling with development mode fallback

6. Implement event participants management
   - Create `src/components/admin/events/EventParticipantsList.tsx`
   - Allow viewing and managing participants
   - Add export functionality

### Phase 4: Landing Page Integration (PENDING)

1. Update EventsSection to display real events
   - Modify `src/components/landing/EventsSection.tsx` to fetch events
   - Display featured events prominently

2. Implement featured events display
   - Create a visually appealing display for featured events
   - Add toggle functionality for store owners to feature/unfeature events

3. Add carousel for multiple featured events
   - Implement a carousel component for multiple events
   - Add navigation controls

### Phase 5: Testing and Refinement (PENDING)

1. Test all functionality
   - Test database migrations
   - Test API functions
   - Test UI components
   - Test real-time updates

2. Fix any issues
   - Address any bugs or edge cases
   - Improve error handling

3. Refine UI/UX
   - Polish the visual design
   - Improve user interactions

4. Conduct user acceptance testing
   - Get feedback from store owners and club members
   - Make adjustments based on feedback

## Files to Create/Modify

### Database Migration (COMPLETED)

- ✅ `supabase/migrations/20250610_enhance_events_tables.sql`
  - Enhanced the events table with additional fields
  - Created event_participants and event_notifications tables
  - Added RLS policies for security

### API Implementation (COMPLETED)

- ✅ `src/lib/api/bookclubs/events.ts`
  - Implemented event management functions
  - Added permission checks for store owners/managers
  - Implemented featured events functionality

- ✅ `src/lib/api/bookclubs/participants.ts`
  - Implemented RSVP functionality
  - Added participant management functions
  - Implemented participant counts

- ✅ `src/lib/api/bookclubs/notifications.ts`
  - Implemented notification management functions
  - Added real-time subscription functionality
  - Implemented read/unread status management

- ✅ `src/lib/api/index.ts` and `src/lib/api/bookclubs/index.ts`
  - Updated to export the new functions

### BookClub UI Components (COMPLETED)

- ✅ `src/components/events/NotificationBadge.tsx`
  - Created reusable badge component for notifications

- ✅ `src/components/events/EventsNavItem.tsx`
  - Integrated notification badge with navigation

- ✅ `src/components/events/EventList.tsx`
  - Implemented list component for displaying events
  - Added loading, error, and empty states

- ✅ `src/components/events/EventCard.tsx`
  - Created card component for displaying event information
  - Added formatting for dates, times, and event types

- ✅ `src/components/events/EventFilters.tsx`
  - Implemented filtering and sorting options

- ✅ `src/components/events/RsvpButton.tsx`
  - Created RSVP functionality with dropdown options
  - Added status display and cancel option

- ✅ `src/components/events/ParticipantsList.tsx`
  - Implemented tabbed list of participants by RSVP status
  - Added participant counts

- ✅ `src/pages/EventDetailsPage.tsx`
  - Created detailed view of event information
  - Integrated RSVP and participants components
  - Added sharing functionality

- ✅ `src/pages/Events.tsx` (modified)
  - Enhanced with filtering, sorting, and real-time updates
  - Integrated with notification system

- ✅ `src/hooks/useEventNotifications.ts`
  - Created hook for fetching and tracking notifications
  - Implemented real-time subscription

- ✅ `src/hooks/useEvents.ts`
  - Created hook for fetching and filtering events
  - Implemented sorting and real-time updates

### Admin UI Components (IN PROGRESS)

- ✅ `src/components/layouts/AdminLayout.tsx` (modified)
  - Added Events section to admin sidebar
  - Made it visible only to users with the CAN_MANAGE_STORE_EVENTS entitlement

- ✅ `src/components/admin/events/EventManagementList.tsx`
  - Created list component for managing events with responsive grid layout
  - Implemented consistent card design with proper spacing and alignment
  - Added event type badges and featured status indicators
  - Implemented dropdown menu for event actions (view, edit, delete)
  - Added proper text truncation and overflow handling for all content
  - Ensured consistent button sizing and alignment in card footers

- ✅ `src/components/admin/events/EventForm.tsx`
  - Created form for adding/editing events with validation
  - Implemented form sections for better organization
  - Added responsive layout with proper spacing

- ✅ `src/components/admin/events/form-sections/BasicInfoSection.tsx`
  - Created section for title, description, event type, and club selection
  - Fixed SelectItem value issue to prevent empty string values

- ✅ `src/components/admin/events/form-sections/DateTimeSection.tsx`
  - Created section for start/end date and time selection
  - Implemented date validation to ensure end time is after start time

- ✅ `src/components/admin/events/form-sections/LocationSection.tsx`
  - Created section for physical/virtual location details
  - Added conditional fields based on whether the event is virtual

- ✅ `src/components/admin/events/form-sections/AdditionalSettingsSection.tsx`
  - Created section for max participants and featured status
  - Implemented number validation for max participants

- ✅ `src/components/admin/events/FeaturedEventsToggle.tsx`
  - Created toggle for featuring events on landing page
  - Added tooltip for better usability
  - Implemented visual feedback for featured status
  - Set fixed width and height for consistent button sizing

- ✅ `src/pages/admin/AdminEventsPage.tsx`
  - Created page for managing events with statistics cards
  - Implemented filtering, sorting, and search functionality
  - Added development mode with mock data for testing without permissions
  - Implemented error handling for permission issues

- ✅ `src/pages/admin/CreateEventPage.tsx`
  - Created page for adding new events
  - Implemented form validation and submission handling

- ✅ `src/pages/admin/EditEventPage.tsx`
  - Created page for editing existing events
  - Implemented data fetching and form pre-filling
  - Added loading states and error handling

- `src/components/admin/events/EventParticipantsList.tsx`
  - Create component for managing participants
  - Add export functionality

### Landing Page Integration (PENDING)

- `src/components/landing/EventsSection.tsx` (modify existing)
  - Update to display real events from database
  - Prioritize featured events

### Route Configuration (COMPLETED)

- ✅ `src/App.tsx` (modified)
  - Added route for event details page

## Running Supabase Migrations

Before testing the UI components, you need to run the Supabase migrations to set up the database schema:

1. Ensure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Run the migration:
   ```bash
   supabase db push
   ```

   This will apply the migration file `supabase/migrations/20250610_enhance_events_tables.sql` to your Supabase database.

3. Alternatively, you can manually execute the SQL in the migration file through the Supabase dashboard:
   - Go to the Supabase dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of the migration file
   - Execute the SQL

4. Verify the migration was successful:
   - Check that the `events` table has the new columns
   - Confirm that the `event_participants` and `event_notifications` tables exist
   - Test the RLS policies by making API calls with different user roles

## Current Progress

As of now, we have completed:

1. **Phase 1: Database Schema and API Implementation**
   - Created and tested the database migration
   - Implemented all necessary API functions for events, participants, and notifications
   - Added proper permission checks and RLS policies

2. **Phase 2: BookClub Events UI Enhancement**
   - Created the notification badge component for the Events navigation item
   - Enhanced the Events list page with filtering and sorting options
   - Implemented the Event details page with RSVP functionality
   - Added real-time updates for events and notifications

3. **Phase 3: Admin Events UI Implementation (Mostly Complete)**
   - Added an Events section to the admin panel
   - Created event management components with consistent layout:
     - Implemented responsive grid layout for event cards
     - Ensured consistent card heights with flex layout
     - Added proper text truncation and overflow handling
     - Implemented consistent button sizing and alignment
     - Added visual indicators for event types and featured status
   - Implemented event creation/editing forms with validation
   - Added development mode with mock data for testing without permissions
   - Fixed UI layout issues to ensure consistent appearance across all event cards
   - Implemented featured events toggle with proper visual feedback

The next steps are:

1. **Complete Phase 3: Admin Events UI Implementation**
   - Implement event participants management component
   - Add export functionality for participant lists

2. **Phase 4: Landing Page Integration**
   - Update the landing page to display real events
   - Implement featured events functionality

## Conclusion

The Events feature enhancement is progressing very well, with the database schema, API implementation, BookClub UI components, and most of the Admin UI components now complete. The foundation is solid, with proper permission checks, real-time updates, and a user-friendly interface for viewing and interacting with events.

The Admin Events UI has been significantly enhanced with:
- A responsive grid layout for event cards with consistent heights and spacing
- Proper text truncation and overflow handling for all content
- Consistent button sizing and alignment in card footers
- Visual indicators for event types and featured status
- Development mode with mock data for testing without permissions
- Comprehensive form sections for event creation and editing

The remaining work focuses on completing the event participants management component and integrating with the landing page to showcase featured events. Once these final pieces are in place, we will have a comprehensive event management system that enhances the BookConnect application's functionality and user experience.
