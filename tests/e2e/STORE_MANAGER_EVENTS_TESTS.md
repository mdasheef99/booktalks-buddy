# Store Manager Events Management - E2E Test Suite

## Overview

This document describes the comprehensive end-to-end test suite for the Store Manager Events Management system. The tests validate all aspects of the Store Manager Events functionality including access control, CRUD operations, store scoping, and user interface components.

## Test Architecture

### Test Files Structure

```
tests/e2e/
├── store-manager-events.spec.ts           # Core functionality tests
├── store-manager-events-advanced.spec.ts  # Advanced scenarios and edge cases
├── page-objects/
│   └── StoreManagerEventsPage.ts         # Page Object Model for events
├── helpers/
│   └── store-manager-helpers.ts          # Shared helper functions
└── run-store-manager-events-tests.ts     # Custom test runner
```

### Test Categories

#### 1. **Core Functionality Tests** (`store-manager-events.spec.ts`)
- **Access Control**: Store Manager authentication and route access
- **Page Display**: Events page layout, statistics, and navigation
- **CRUD Operations**: Create, read, update, delete events
- **Store Scoping**: Verify events are filtered by Store Manager's store
- **Search & Filtering**: Event search, filtering, and sorting functionality
- **Form Validation**: Input validation and error handling
- **UI Components**: Responsive design and component interactions

#### 2. **Advanced Scenarios** (`store-manager-events-advanced.spec.ts`)
- **Complex Data Handling**: Special characters, unicode, long text
- **Edge Cases**: Boundary conditions, extreme values
- **Concurrent Operations**: Multi-tab/user scenarios
- **Error Handling**: Network failures, API errors
- **Performance**: Large datasets, response times
- **Accessibility**: Keyboard navigation, screen readers
- **Business Rules**: Complex validation scenarios

## Test Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application base URL | `http://localhost:5173` |
| `BROWSER` | Browser to use for tests | `chromium` |
| `HEADLESS` | Run tests headless | `true` |
| `WORKERS` | Number of parallel workers | `1` |
| `RETRIES` | Number of retries on failure | `2` |
| `TIMEOUT` | Test timeout in milliseconds | `60000` |
| `STORE_MANAGER_PASSWORD` | Password for test account | `kafka` |

### Test Account

- **Email**: `kafka@bookconnect.com`
- **Username**: `kafka`
- **Role**: Store Manager for Default Store
- **Store ID**: `ce76b99a-5f1a-481a-af85-862e584465e1`
- **Store Name**: `Default Store`

## Running Tests

### Quick Start

```bash
# Run all Store Manager Events tests
npm run test:e2e:store-manager-events

# Run basic functionality tests only
npm run test:e2e:store-manager-events:basic

# Run advanced scenarios only
npm run test:e2e:store-manager-events:advanced

# Run tests with browser visible (headed mode)
npm run test:e2e:store-manager-events:headed

# Run tests in debug mode
npm run test:e2e:store-manager-events:debug
```

### Advanced Usage

```bash
# Run specific test pattern
node tests/e2e/run-store-manager-events-tests.ts --grep="should create"

# Run with custom configuration
BROWSER=firefox WORKERS=2 npm run test:e2e:store-manager-events

# Run with Playwright UI
node tests/e2e/run-store-manager-events-tests.ts --ui
```

## Test Scenarios

### 1. Access Control & Authentication

#### Test: Store Manager Events Access
- **Objective**: Verify Store Manager can access events management
- **Steps**:
  1. Login as Store Manager (`kafka@bookconnect.com`)
  2. Navigate to `/store-manager/events`
  3. Verify page loads with proper Store Manager context
  4. Verify store-scoped data display

#### Test: Route Protection
- **Objective**: Ensure unauthorized users cannot access Store Manager routes
- **Steps**:
  1. Access `/store-manager/events` without authentication
  2. Verify redirect to login page
  3. Login as regular user
  4. Verify access denied or redirect

### 2. Event CRUD Operations

#### Test: Event Creation
- **Objective**: Verify Store Manager can create new events
- **Test Data**:
  ```javascript
  {
    title: 'E2E Test Event',
    description: 'Test event description',
    eventType: 'discussion',
    location: 'Test Location',
    startDate: '2025-02-15',
    startTime: '18:00',
    endDate: '2025-02-15',
    endTime: '20:00',
    maxParticipants: '25'
  }
  ```
- **Steps**:
  1. Click "Create Event" button
  2. Fill event form with test data
  3. Submit form
  4. Verify success message
  5. Verify event appears in events list

#### Test: Event Editing
- **Objective**: Verify Store Manager can edit existing events
- **Steps**:
  1. Create test event
  2. Navigate to edit page
  3. Modify event details
  4. Submit changes
  5. Verify updates are reflected

#### Test: Event Deletion
- **Objective**: Verify Store Manager can delete events with confirmation
- **Steps**:
  1. Create test event
  2. Open event menu
  3. Click delete option
  4. Confirm deletion in dialog
  5. Verify event is removed from list

### 3. Store Scoping & Data Access

#### Test: Store-Scoped Event Display
- **Objective**: Verify Store Manager sees only events from their store
- **Steps**:
  1. Login as Store Manager
  2. Navigate to events page
  3. Verify all displayed events belong to Store Manager's store
  4. Verify store context is properly displayed

#### Test: Store-Scoped Book Clubs
- **Objective**: Verify event form shows only clubs from Store Manager's store
- **Steps**:
  1. Navigate to create event page
  2. Check club dropdown options
  3. Verify only store clubs are available

### 4. Search & Filtering

#### Test: Event Search
- **Objective**: Verify event search functionality works correctly
- **Steps**:
  1. Enter search query in search input
  2. Verify results are filtered by query
  3. Clear search
  4. Verify all events are shown again

#### Test: Event Filtering
- **Objective**: Verify event filtering by type and status
- **Steps**:
  1. Apply "Upcoming" filter
  2. Verify only upcoming events are shown
  3. Apply "Featured" filter
  4. Verify only featured events are shown
  5. Reset to "All Events"

### 5. Form Validation

#### Test: Required Field Validation
- **Objective**: Verify form validates required fields
- **Steps**:
  1. Submit empty event form
  2. Verify error message for missing title
  3. Fill title and submit
  4. Verify other validation errors as appropriate

#### Test: Date/Time Validation
- **Objective**: Verify business rules for event dates and times
- **Test Cases**:
  - Past start date → Error: "Event start time must be in the future"
  - End time before start time → Error: "End time must be after start time"
  - Duration less than 15 minutes → Error: "Duration must be at least 15 minutes"
  - Event more than 1 year in future → Error: "Cannot schedule more than 1 year in advance"

### 6. UI Components & Responsive Design

#### Test: Statistics Cards
- **Objective**: Verify event statistics are displayed correctly
- **Steps**:
  1. Navigate to events page
  2. Verify presence of statistics cards:
     - Total Events
     - Upcoming Events
     - Past Events
     - Featured Events
  3. Verify statistics show numeric values

#### Test: Responsive Design
- **Objective**: Verify interface works on different screen sizes
- **Steps**:
  1. Test desktop view (1280x720)
  2. Test tablet view (768x1024)
  3. Test mobile view (375x667)
  4. Verify layout adapts appropriately

## Test Data Management

### Test Event Data

```javascript
// Basic test event
const TEST_EVENT_DATA = {
  title: 'E2E Test Event',
  description: 'This is a test event created by automated E2E tests',
  eventType: 'discussion',
  location: 'Test Location',
  startDate: '2025-02-15',
  startTime: '18:00',
  endDate: '2025-02-15',
  endTime: '20:00',
  maxParticipants: '25'
};

// Complex test data with special characters
const COMPLEX_EVENT_DATA = {
  title: 'Advanced E2E Test Event with Special Characters & Symbols',
  description: 'Test with special chars: @#$%^&*()_+{}|:"<>?[]\\;\',./ and unicode: 📚📖✨',
  eventType: 'author_meet',
  location: 'Multi-line location\nSecond line\nCity, State 12345',
  isVirtual: true,
  virtualLink: 'https://meet.example.com/test-event'
};

// Edge case data
const EDGE_CASE_EVENT_DATA = {
  title: 'A'.repeat(100), // Long title
  description: 'B'.repeat(500), // Long description
  startDate: '2025-12-31', // End of year
  endDate: '2026-01-01', // Cross year boundary
  maxParticipants: '1' // Minimum participants
};
```

### Cleanup Strategy

- **Automatic Cleanup**: Tests automatically delete created events in `afterEach` hooks
- **Manual Cleanup**: Helper function `deleteTestEvent()` for explicit cleanup
- **Isolation**: Each test creates unique test data to avoid conflicts

## Reporting & Debugging

### Test Reports

Tests generate multiple report formats:

- **HTML Report**: `tests/e2e/test-results/store-manager-events/reports/html/index.html`
- **JSON Report**: `tests/e2e/test-results/store-manager-events/reports/results.json`
- **JUnit Report**: `tests/e2e/test-results/store-manager-events/reports/results.xml`

### Screenshots & Videos

- **Screenshots**: Captured on test failure
- **Videos**: Recorded for failed tests
- **Location**: `tests/e2e/test-results/store-manager-events/`

### Debugging

```bash
# Run tests in debug mode (step through)
npm run test:e2e:store-manager-events:debug

# Run tests with browser visible
npm run test:e2e:store-manager-events:headed

# Run specific test
node tests/e2e/run-store-manager-events-tests.ts --grep="should create"

# Run with Playwright UI for interactive debugging
node tests/e2e/run-store-manager-events-tests.ts --ui
```

## Continuous Integration

### Prerequisites

1. **Dev Server Running**: Application must be running on `BASE_URL`
2. **Database Setup**: Test database with Store Manager account configured
3. **Environment Variables**: All required environment variables set

### CI Configuration

```yaml
# Example GitHub Actions configuration
- name: Run Store Manager Events E2E Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:e2e:store-manager-events
  env:
    BASE_URL: http://localhost:5173
    STORE_MANAGER_PASSWORD: ${{ secrets.STORE_MANAGER_PASSWORD }}
    HEADLESS: true
```

## Maintenance

### Adding New Tests

1. **Basic Tests**: Add to `store-manager-events.spec.ts`
2. **Advanced Tests**: Add to `store-manager-events-advanced.spec.ts`
3. **Page Objects**: Update `StoreManagerEventsPage.ts` for new UI elements
4. **Helpers**: Add reusable functions to `store-manager-helpers.ts`

### Updating Test Data

- Update test data constants at the top of test files
- Ensure cleanup functions handle new data structures
- Update page object locators for UI changes

### Performance Considerations

- **Parallel Execution**: Tests run with limited workers to avoid conflicts
- **Test Isolation**: Each test is independent and cleans up after itself
- **Selective Running**: Use test patterns to run specific subsets
- **Timeout Management**: Appropriate timeouts for different operations

---

**Last Updated**: 2025-01-23  
**Test Coverage**: Store Manager Events Management (Complete)  
**Maintainer**: BookTalks Buddy Development Team
