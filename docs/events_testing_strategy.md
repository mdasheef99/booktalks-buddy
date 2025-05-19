# BookConnect Events Feature Testing Strategy

## Overview

This document outlines a comprehensive testing strategy for the BookConnect Events feature. The strategy covers unit testing, integration testing, end-to-end testing, and specialized testing for critical functionality. It is organized by user roles and feature components to ensure complete coverage.

## 1. Unit Testing Approach

### 1.1 API Functions Testing

#### Events API (`src/lib/api/bookclubs/events/`)

| Function | Test Cases |
|----------|------------|
| `createEvent` | - Verify event creation with valid data<br>- Verify permission checks for store owners/managers<br>- Verify error handling for invalid data<br>- Verify notification creation for club events |
| `updateEvent` | - Verify event updates with valid data<br>- Verify permission checks for event creators/store owners<br>- Verify error handling for invalid data |
| `deleteEvent` | - Verify event deletion<br>- Verify permission checks<br>- Verify cascade deletion of participants and notifications |
| `getEvent` | - Verify retrieval of existing event<br>- Verify error handling for non-existent event |
| `getClubEvents` | - Verify retrieval of events for a specific club<br>- Verify filtering and sorting options |
| `getStoreEvents` | - Verify retrieval of events for a specific store<br>- Verify permission checks<br>- Verify filtering and sorting options |
| `getFeaturedEvents` | - Verify retrieval of featured events<br>- Verify ordering by date |
| `toggleEventFeatured` | - Verify toggling featured status<br>- Verify permission checks |
| `uploadEventImage` | - Verify image upload with valid file<br>- Verify image processing (thumbnail, medium)<br>- Verify error handling for invalid files<br>- Verify permission checks |
| `removeEventImage` | - Verify image removal<br>- Verify permission checks |

#### Participants API (`src/lib/api/bookclubs/participants.ts`)

| Function | Test Cases |
|----------|------------|
| `rsvpToEvent` | - Verify RSVP creation with valid status<br>- Verify club membership checks<br>- Verify updating existing RSVP |
| `cancelRsvp` | - Verify RSVP cancellation<br>- Verify permission checks |
| `getEventParticipants` | - Verify retrieval of participants<br>- Verify user details inclusion |
| `getUserRsvpStatus` | - Verify retrieval of user's RSVP status<br>- Verify handling of no RSVP |
| `getUserRsvpEvents` | - Verify retrieval of user's RSVPed events<br>- Verify event details inclusion |
| `getEventParticipantCounts` | - Verify counts by RSVP status<br>- Verify handling of no participants |

#### Notifications API (`src/lib/api/bookclubs/notifications.ts`)

| Function | Test Cases |
|----------|------------|
| `getUnreadEventNotifications` | - Verify retrieval of unread notifications<br>- Verify event details inclusion |
| `getAllEventNotifications` | - Verify retrieval of all notifications<br>- Verify ordering by date |
| `markEventNotificationAsRead` | - Verify marking as read<br>- Verify permission checks |
| `markAllEventNotificationsAsRead` | - Verify marking all as read<br>- Verify permission checks |
| `getUnreadEventNotificationsCount` | - Verify count calculation<br>- Verify handling of no notifications |
| `createEventNotification` | - Verify notification creation<br>- Verify error handling |
| `deleteEventNotification` | - Verify notification deletion<br>- Verify permission checks |
| `subscribeToEventNotifications` | - Verify subscription creation<br>- Verify callback execution on new notifications |

### 1.2 UI Components Testing

#### BookClub Events Components

| Component | Test Cases |
|-----------|------------|
| `NotificationBadge` | - Verify badge display with count<br>- Verify zero count handling |
| `EventsNavItem` | - Verify navigation item with badge<br>- Verify click handling |
| `EventList` | - Verify rendering of event list<br>- Verify loading state<br>- Verify error state<br>- Verify empty state |
| `EventCard` | - Verify rendering of event details<br>- Verify image handling<br>- Verify date/time formatting<br>- Verify event type badge |
| `EventFilters` | - Verify filter options<br>- Verify filter application<br>- Verify sort options |
| `RsvpButton` | - Verify RSVP options display<br>- Verify RSVP submission<br>- Verify current status display<br>- Verify cancel option |
| `ParticipantsList` | - Verify participants display by status<br>- Verify count display<br>- Verify empty state |

#### Admin Events Components

| Component | Test Cases |
|-----------|------------|
| `EventManagementList` | - Verify rendering of event cards<br>- Verify empty state<br>- Verify action handling (view, edit, delete) |
| `EventCard` | - Verify rendering of event details<br>- Verify action menu<br>- Verify featured toggle |
| `EventForm` | - Verify form fields and validation<br>- Verify submission handling<br>- Verify pre-filling for editing |
| `BasicInfoSection` | - Verify title, description, type fields<br>- Verify club selection |
| `DateTimeSection` | - Verify date/time selection<br>- Verify validation (end after start) |
| `LocationSection` | - Verify location fields<br>- Verify conditional fields for virtual events |
| `AdditionalSettingsSection` | - Verify max participants field<br>- Verify featured toggle |
| `FeaturedEventsToggle` | - Verify toggle state<br>- Verify click handling |
| `EventParticipantsList` | - Verify participants display<br>- Verify export functionality |

#### Landing Page Components

| Component | Test Cases |
|-----------|------------|
| `EventsSection` | - Verify featured events display<br>- Verify carousel functionality<br>- Verify "View All" button |
| `EventCarousel` | - Verify slide navigation<br>- Verify event card rendering |
| `EventCard` | - Verify event details display<br>- Verify image handling |

### 1.3 Hooks Testing

| Hook | Test Cases |
|------|------------|
| `useEvents` | - Verify event fetching<br>- Verify filtering and sorting<br>- Verify error handling |
| `useEventNotifications` | - Verify notification count fetching<br>- Verify real-time updates<br>- Verify refresh functionality |
| `useEventRealtime` | - Verify real-time subscription<br>- Verify event updates handling<br>- Verify connection state |
| `useParticipantsData` | - Verify participants data fetching<br>- Verify real-time updates<br>- Verify loading and error states |
| `useParticipantsExport` | - Verify export functionality<br>- Verify format options |

## 2. Integration Testing Strategy

### 2.1 Component Integration Tests

| Integration Point | Test Cases |
|-------------------|------------|
| Events Page + API | - Verify events display with real API data<br>- Verify filtering and sorting with API<br>- Verify notification badge updates |
| Event Details + RSVP | - Verify RSVP functionality with API<br>- Verify participants list updates<br>- Verify notification creation |
| Admin Events + API | - Verify event management with API<br>- Verify create/edit/delete operations<br>- Verify featured toggle with API |
| Landing Page + Featured Events | - Verify featured events display from API<br>- Verify carousel with real events |

### 2.2 Data Flow Tests

| Data Flow | Test Cases |
|-----------|------------|
| Event Creation → Notifications | - Verify notification creation for club members<br>- Verify real-time updates |
| RSVP → Participant Counts | - Verify participant count updates<br>- Verify real-time updates |
| Featured Toggle → Landing Page | - Verify landing page updates with featured events |

## 3. End-to-End Testing Scenarios

### 3.1 Store Owner Journey

1. Log in as store owner
2. Navigate to admin panel
3. Create a new event with all details
4. Verify event appears in management list
5. Edit the event
6. Toggle featured status
7. View event participants
8. Delete the event

### 3.2 Club Member Journey

1. Log in as club member
2. View notification badge for new events
3. Navigate to events page
4. Filter and sort events
5. View event details
6. RSVP to an event
7. View participants list
8. Cancel RSVP

### 3.3 Landing Page Visitor Journey

1. Visit landing page
2. View featured events
3. Navigate through event carousel
4. Click "View All Events"
5. View events list page

## 4. Critical Functionality Test Cases

### 4.1 Event Creation and Management

- Create events with various types (discussion, author_meet, etc.)
- Create events with/without club association
- Create events with/without images
- Edit all event properties
- Delete events and verify cascade deletion

### 4.2 RSVP Functionality

- RSVP with different statuses (going, maybe, not_going)
- Change RSVP status
- Cancel RSVP
- Verify participant counts update correctly
- Test max participants limit

### 4.3 Notifications

- Verify notifications created for new club events
- Verify real-time notification updates
- Mark notifications as read individually and all at once
- Verify unread count updates correctly

### 4.4 Image Handling

- Upload images of different sizes and formats
- Verify thumbnail and medium image generation
- Verify image display in different contexts
- Remove images and verify cleanup

## 5. Recommended Testing Tools and Frameworks

| Tool/Framework | Purpose |
|----------------|---------|
| Vitest | Unit and integration testing |
| React Testing Library | Component testing |
| MSW (Mock Service Worker) | API mocking |
| Cypress | End-to-end testing |
| Storybook | Component development and visual testing |
| Supabase Local Development | Database testing |
| Playwright | Cross-browser testing |

## 6. Automated Testing Implementation

### 6.1 Unit and Integration Tests

- Implement unit tests for all API functions using Vitest
- Implement component tests using React Testing Library
- Use MSW to mock API responses
- Set up test database with seed data

### 6.2 End-to-End Tests

- Implement E2E tests using Cypress or Playwright
- Create test users with different roles
- Set up test scenarios for critical user journeys

### 6.3 CI/CD Integration

- Configure GitHub Actions to run tests on pull requests
- Set up test coverage reporting
- Implement visual regression testing
- Configure deployment previews with Vercel or Netlify

## 7. Performance Testing Considerations

- Test image upload and processing performance
- Test real-time updates with multiple concurrent users
- Test event list rendering with large datasets
- Test notification system with high volume
- Monitor and optimize database queries

## 8. Security Testing Approach

- Test RLS policies for proper access control
- Verify permission checks in all API functions
- Test against common vulnerabilities (XSS, CSRF)
- Verify secure handling of user data
- Test image upload security (file type validation, size limits)

## 9. Progress

### 9.1 Current Implementation Status

We have successfully implemented unit tests for the BookConnect Events feature, focusing on both the core API functions and UI components. Our current implementation includes:

1. **Query Functions Tests** (`queries.test.ts`):
   - Implemented tests for `getEvent`, `getClubEvents`, and `getFeaturedEvents`
   - Current status: 10/10 tests passing (100% pass rate)
   - Coverage includes successful data retrieval, error handling, and filtering/sorting

2. **Utility Functions Tests** (`utils.test.ts`):
   - Implemented tests for date formatting, event type labeling, future event detection, and date validation
   - Current status: 19/19 tests passing (100% pass rate)
   - Coverage includes edge cases like null/undefined values and various event types

3. **Core Functions Tests** (`core.test.ts`):
   - Implemented tests for `createEvent` with various scenarios
   - Current status: 5/5 tests passing (100% pass rate)
   - Tests cover permission checks, notification creation, and error handling

4. **UI Component Tests**:
   - **EventCard** (`EventCard.test.tsx`):
     - Implemented tests for rendering event details, date/time formatting, event type badges, location display, virtual badges, and images
     - Implemented interaction tests for navigation to event details
     - Current status: 7/7 tests passing (100% pass rate)

   - **EventList** (`EventList.test.tsx`):
     - Implemented tests for rendering event lists, loading states, error states, and empty states
     - Current status: 5/5 tests passing (100% pass rate)

   - **RsvpButton** (`RsvpButton.test.tsx`):
     - Created initial test structure for rendering and interaction tests
     - Current status: 0/7 tests passing (0% pass rate)
     - Tests need further work to properly mock dependencies

   - **EventForm** (`EventForm.test.tsx`):
     - Created initial test structure for rendering and form submission
     - Current status: 0/7 tests passing (0% pass rate)
     - Tests need further work to properly mock dependencies

### 9.2 Identified Issues

1. **RsvpButton Component Testing Issues**:
   - Tests for the RsvpButton component are failing due to mocking issues
   - Error: "customMocks is not defined" in the useAuth mock
   - Need to refactor the mocking approach to properly handle context providers and hooks

2. **EventForm Component Testing Issues**:
   - Tests for the EventForm component are failing due to module mocking issues
   - Error: "Cannot find module '@/lib/api/bookclubs/events/core'" when trying to mock the createEvent function
   - Need to improve the mocking strategy for imported modules

3. **Complex Component Testing Challenges**:
   - Components with multiple dependencies (contexts, hooks, API calls) are challenging to test
   - Need to develop a more robust approach for mocking complex dependencies
   - Consider creating test utilities for common mocking patterns

### 9.3 Test Coverage Analysis

| Category | Implemented | Not Implemented | Pass Rate |
|----------|-------------|-----------------|-----------|
| API Query Functions | 3/7 | 4/7 | 100% |
| API Mutation Functions | 1/7 | 6/7 | 100% |
| Utility Functions | 5/5 | 0/5 | 100% |
| UI Components | 4/14 | 10/14 | 50% |
| Hooks | 0/5 | 5/5 | N/A |
| Integration Tests | 0/7 | 7/7 | N/A |
| E2E Tests | 0/3 | 3/3 | N/A |

**UI Components Breakdown**:

| Component | Status | Pass Rate |
|-----------|--------|-----------|
| EventCard | Implemented | 100% (7/7) |
| EventList | Implemented | 100% (5/5) |
| RsvpButton | Started | 0% (0/7) |
| EventForm | Started | 0% (7/7) |
| EventFilters | Not Implemented | N/A |
| ParticipantsList | Not Implemented | N/A |
| EventManagementList | Not Implemented | N/A |
| BasicInfoSection | Not Implemented | N/A |
| DateTimeSection | Not Implemented | N/A |
| LocationSection | Not Implemented | N/A |
| AdditionalSettingsSection | Not Implemented | N/A |
| FeaturedEventsToggle | Not Implemented | N/A |
| EventParticipantsList | Not Implemented | N/A |
| EventsSection | Not Implemented | N/A |

## 10. Next Steps

### 10.1 Immediate Next Steps for Testing Implementation

#### 10.1.1 Create Test Utilities (First Priority)

1. Create a `test-utils.tsx` file in the `src/tests` directory:
   ```typescript
   // src/tests/test-utils.tsx
   import React from 'react';
   import { render } from '@testing-library/react';
   import { AuthContext } from '@/contexts/AuthContext';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   import { Event } from '@/lib/supabase';

   // Custom render function with providers
   export function renderWithProviders(
     ui,
     {
       authUser = { id: 'test-user-id' },
       queryClient = new QueryClient(),
       ...renderOptions
     } = {}
   ) {
     function Wrapper({ children }) {
       return (
         <AuthContext.Provider value={{ user: authUser }}>
           <QueryClientProvider client={queryClient}>
             {children}
           </QueryClientProvider>
         </AuthContext.Provider>
       );
     }
     return render(ui, { wrapper: Wrapper, ...renderOptions });
   }

   // Event factory function
   export function createMockEvent(overrides = {}): Event {
     return {
       id: 'test-event-id',
       title: 'Test Event',
       description: 'This is a test event description',
       date: '2023-07-15', // Required field
       start_time: '2023-07-15T18:00:00Z',
       end_time: '2023-07-15T20:00:00Z',
       location: 'Test Location',
       event_type: 'discussion',
       is_virtual: false,
       virtual_meeting_link: null,
       max_participants: 20,
       featured_on_landing: false,
       created_by: 'test-user-id',
       club_id: 'test-club-id',
       store_id: 'test-store-id',
       created_at: '2023-07-01T12:00:00Z',
       updated_at: '2023-07-01T12:00:00Z',
       image_url: null,
       thumbnail_url: null,
       medium_url: null,
       image_alt_text: null,
       image_metadata: null,
       ...overrides
     };
   }
   ```

2. Create API mocking utilities:
   ```typescript
   // src/tests/api-mocks.ts
   import { vi } from 'vitest';

   export function mockEventApi() {
     vi.mock('@/lib/api/bookclubs/events/core', () => ({
       createEvent: vi.fn().mockResolvedValue({ id: 'new-event-id' }),
       updateEvent: vi.fn().mockResolvedValue({ id: 'updated-event-id' }),
       deleteEvent: vi.fn().mockResolvedValue({ success: true })
     }));
   }

   export function mockParticipantsApi() {
     vi.mock('@/lib/api/bookclubs/participants', () => ({
       rsvpToEvent: vi.fn().mockResolvedValue({ rsvp_status: 'going' }),
       cancelRsvp: vi.fn().mockResolvedValue({ success: true }),
       getUserRsvpStatus: vi.fn().mockResolvedValue(null),
       getEventParticipants: vi.fn().mockResolvedValue([])
     }));
   }
   ```

#### 10.1.2 Fix RsvpButton Tests (Second Priority)

1. Rewrite the `RsvpButton.test.tsx` file using the new test utilities:
   ```typescript
   // src/components/events/RsvpButton.test.tsx
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { screen, waitFor } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import RsvpButton from './RsvpButton';
   import { renderWithProviders, createMockEvent } from '@/tests/test-utils';

   // Mock modules at the top of the file
   vi.mock('@/lib/api/bookclubs/participants', () => ({
     rsvpToEvent: vi.fn().mockResolvedValue({ rsvp_status: 'going' }),
     cancelRsvp: vi.fn().mockResolvedValue({ success: true }),
     getUserRsvpStatus: vi.fn().mockResolvedValue(null)
   }));

   vi.mock('@tanstack/react-query', () => ({
     useQuery: () => ({
       data: null,
       isLoading: false
     }),
     useQueryClient: () => ({
       invalidateQueries: vi.fn()
     })
   }));

   vi.mock('sonner', () => ({
     toast: {
       success: vi.fn(),
       error: vi.fn()
     }
   }));

   describe('RsvpButton', () => {
     const eventId = 'test-event-id';

     // Reset mocks before each test
     beforeEach(() => {
       vi.clearAllMocks();
     });

     // Test cases...
   });
   ```

2. Implement the test cases using the new approach.

#### 10.1.3 Fix EventForm Tests (Third Priority)

1. Rewrite the `EventForm.test.tsx` file using the new test utilities:
   ```typescript
   // src/components/admin/events/EventForm.test.tsx
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { screen, waitFor } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import EventForm from './EventForm';
   import { renderWithProviders, createMockEvent } from '@/tests/test-utils';

   // Mock modules at the top of the file
   vi.mock('@/lib/api/bookclubs/events/core', () => ({
     createEvent: vi.fn().mockResolvedValue({ id: 'new-event-id' }),
     updateEvent: vi.fn().mockResolvedValue({ id: 'updated-event-id' })
   }));

   vi.mock('react-router-dom', () => ({
     useNavigate: () => vi.fn()
   }));

   vi.mock('sonner', () => ({
     toast: {
       success: vi.fn(),
       error: vi.fn()
     }
   }));

   // Mock form sections
   vi.mock('./form-sections/BasicInfoSection', () => ({
     default: ({ title, setTitle, description, setDescription }) => (
       <div data-testid="basic-info-section">
         <input
           data-testid="title-input"
           value={title}
           onChange={(e) => setTitle(e.target.value)}
         />
         <textarea
           data-testid="description-input"
           value={description}
           onChange={(e) => setDescription(e.target.value)}
         />
       </div>
     )
   }));

   // Add other form section mocks...

   describe('EventForm', () => {
     // Reset mocks before each test
     beforeEach(() => {
       vi.clearAllMocks();
     });

     // Test cases...
   });
   ```

2. Implement the test cases using the new approach.

### 10.2 Components to Test Next

After fixing the RsvpButton and EventForm tests, implement tests for the following components in this order:

#### 10.2.1 EventFilters Component (Fourth Priority)

1. Create `EventFilters.test.tsx`:
   ```typescript
   // src/components/events/EventFilters.test.tsx
   import { describe, it, expect, vi } from 'vitest';
   import { screen } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import EventFilters from './EventFilters';
   import { renderWithProviders } from '@/tests/test-utils';

   describe('EventFilters', () => {
     // Test rendering of filter options
     it('renders all filter options', () => {
       // Implementation
     });

     // Test filter selection
     it('calls onFilterChange when a filter is selected', async () => {
       // Implementation
     });

     // Test sort selection
     it('calls onSortChange when a sort option is selected', async () => {
       // Implementation
     });

     // Test filter reset
     it('resets all filters when reset button is clicked', async () => {
       // Implementation
     });
   });
   ```

#### 10.2.2 ParticipantsList Component (Fifth Priority)

1. Create `ParticipantsList.test.tsx`:
   ```typescript
   // src/components/events/ParticipantsList.test.tsx
   import { describe, it, expect, vi } from 'vitest';
   import { screen } from '@testing-library/react';
   import ParticipantsList from './ParticipantsList';
   import { renderWithProviders } from '@/tests/test-utils';

   // Mock the participants API
   vi.mock('@/lib/api/bookclubs/participants', () => ({
     getEventParticipants: vi.fn().mockResolvedValue([
       { user_id: 'user1', display_name: 'User One', rsvp_status: 'going' },
       { user_id: 'user2', display_name: 'User Two', rsvp_status: 'maybe' },
       { user_id: 'user3', display_name: 'User Three', rsvp_status: 'not_going' }
     ])
   }));

   describe('ParticipantsList', () => {
     // Test rendering of participants
     it('renders participants grouped by RSVP status', async () => {
       // Implementation
     });

     // Test empty state
     it('displays empty state when there are no participants', async () => {
       // Implementation
     });

     // Test loading state
     it('displays loading state while fetching participants', () => {
       // Implementation
     });

     // Test error state
     it('displays error message when fetching fails', () => {
       // Implementation
     });
   });
   ```

#### 10.2.3 Form Section Components (Sixth Priority)

1. Create tests for each form section component:
   - `BasicInfoSection.test.tsx`
   - `DateTimeSection.test.tsx`
   - `LocationSection.test.tsx`
   - `AdditionalSettingsSection.test.tsx`

2. Example for `BasicInfoSection.test.tsx`:
   ```typescript
   // src/components/admin/events/form-sections/BasicInfoSection.test.tsx
   import { describe, it, expect, vi } from 'vitest';
   import { screen } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import BasicInfoSection from './BasicInfoSection';
   import { render } from '@testing-library/react';

   describe('BasicInfoSection', () => {
     // Test rendering
     it('renders all form fields', () => {
       // Implementation
     });

     // Test field updates
     it('calls setter functions when fields are changed', async () => {
       // Implementation
     });

     // Test validation
     it('displays validation errors for required fields', async () => {
       // Implementation
     });
   });
   ```

### 10.3 Implementation Instructions

When implementing these tests, follow these guidelines:

1. **Use the test utilities**: Always use the `renderWithProviders` function for components that need context.

2. **Mock at the top of the file**: Place all `vi.mock()` calls at the top of the file, before any imports.

3. **Reset mocks in beforeEach**: Use `vi.clearAllMocks()` in a `beforeEach` block to reset mocks between tests.

4. **Test in isolation**: Mock child components to test parent components in isolation.

5. **Test user interactions**: Use `userEvent` to simulate user interactions like clicks and typing.

6. **Test all states**: Test loading, error, empty, and populated states for components that fetch data.

7. **Verify function calls**: Check that callback functions are called with the expected arguments.

8. **Use data-testid attributes**: Add `data-testid` attributes to elements that need to be selected in tests.

9. **Use waitFor for async operations**: Wrap assertions in `waitFor` when testing components with async operations.

10. **Keep tests focused**: Each test should verify one specific behavior or aspect of the component.

## 11. Implementation Plan by Test Category

### 11.1 Remaining UI Component Tests
- Implement tests for the remaining UI components in order of priority:
  1. Form section components (BasicInfoSection, DateTimeSection, etc.)
  2. Interactive components (EventFilters, FeaturedEventsToggle)
  3. Display components (ParticipantsList, EventsSection)

### 11.2 Test Utilities Development
- Create a `test-utils.tsx` file with common testing utilities:
  ```typescript
  // src/tests/test-utils.tsx
  import { render } from '@testing-library/react';
  import { AuthContext } from '@/contexts/AuthContext';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

  // Custom render function that includes providers
  export function renderWithProviders(
    ui,
    {
      authUser = { id: 'test-user-id' },
      queryClient = new QueryClient(),
      ...renderOptions
    } = {}
  ) {
    function Wrapper({ children }) {
      return (
        <AuthContext.Provider value={{ user: authUser }}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </AuthContext.Provider>
      );
    }
    return render(ui, { wrapper: Wrapper, ...renderOptions });
  }
  ```

### 11.3 Hook Tests
- Set up testing utilities for React hooks using `@testing-library/react-hooks`
- Implement tests for data fetching hooks:
  ```typescript
  // Example hook test
  it('should fetch events and handle loading state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useEvents({ clubId: 'test-club' }));

    // Initial state should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the hook to resolve
    await waitForNextUpdate();

    // Should have events data
    expect(result.current.events).toHaveLength(3);
    expect(result.current.isLoading).toBe(false);
  });
  ```

### 11.4 Integration Tests
- Set up MSW for API mocking in integration tests
- Create integration test files for key component combinations:
  - `EventsPage.integration.test.tsx`
  - `EventDetails.integration.test.tsx`
  - `EventCreation.integration.test.tsx`
- Test complete user flows with multiple components

### 11.5 End-to-End Tests
- Set up Cypress for E2E testing
- Create test fixtures for events, users, and clubs
- Implement E2E tests for critical user journeys:
  ```typescript
  // Example Cypress test
  describe('Store Owner Event Creation', () => {
    beforeEach(() => {
      cy.login('store-owner@example.com');
      cy.visit('/admin/events');
    });

    it('should create a new event', () => {
      cy.findByText('Create New Event').click();
      cy.findByLabelText('Title').type('New Test Event');
      // Fill in other fields
      cy.findByText('Create Event').click();
      cy.findByText('Event created successfully').should('exist');
      cy.findByText('New Test Event').should('exist');
    });
  });
  ```

## Conclusion

This testing strategy provides a comprehensive approach to ensuring the quality and reliability of the BookConnect Events feature. By following this strategy, we can identify and address issues early in the development process and deliver a robust feature that meets user needs.

Our implementation has made significant progress on both API function tests and UI component tests. We have successfully implemented and fixed tests for core API functions, utilities, and key UI components like EventCard and EventList. We've also started work on more complex components like RsvpButton and EventForm, though these tests need further refinement to handle their dependencies properly.

The next phase of our testing strategy focuses on:
1. Creating robust test utilities to simplify testing of complex components
2. Completing tests for remaining UI components
3. Implementing hook tests for data management
4. Developing integration tests for key user flows
5. Setting up end-to-end tests for critical user journeys

By continuing to follow this systematic approach, we can achieve comprehensive test coverage for the Events feature, ensuring its reliability and maintainability as the application evolves.
