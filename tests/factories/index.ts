/**
 * Test data factories for BookConnect
 *
 * These factories create consistent test data for use across test files.
 * Each factory has sensible defaults and accepts overrides for specific test cases.
 */

// First, let's check if we can import the actual types from the codebase
// If not, we'll define simplified versions for testing purposes
type EventType = 'discussion' | 'author_meet' | 'book_signing' | 'reading' | 'other';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  location: string;
  is_virtual: boolean;
  virtual_link?: string;
  max_participants?: number;
  is_featured: boolean;
  created_by: string;
  club_id?: string;
  store_id?: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface Club {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  member_count: number;
  is_private: boolean;
}

interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
  created_at: string;
  updated_at: string;
}



/**
 * Creates an event with default values
 * @param overrides Optional properties to override defaults
 * @returns An Event object
 */
export const createEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'test-event-id',
  title: 'Test Event',
  description: 'This is a test event description',
  event_type: 'discussion',
  start_time: '2023-07-15T18:00:00Z',
  end_time: '2023-07-15T20:00:00Z',
  location: 'Test Location',
  is_virtual: false,
  max_participants: 20,
  is_featured: false,
  created_by: 'test-user-id',
  club_id: 'test-club-id',
  created_at: '2023-07-01T12:00:00Z',
  updated_at: '2023-07-01T12:00:00Z',
  ...overrides
});

/**
 * Creates a user with default values
 * @param overrides Optional properties to override defaults
 * @returns A User object
 */
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  display_name: 'Test User',
  bio: 'This is a test user bio',
  created_at: '2023-01-01T12:00:00Z',
  updated_at: '2023-01-01T12:00:00Z',
  ...overrides
});

/**
 * Creates a club with default values
 * @param overrides Optional properties to override defaults
 * @returns A Club object
 */
export const createClub = (overrides: Partial<Club> = {}): Club => ({
  id: 'test-club-id',
  name: 'Test Book Club',
  description: 'This is a test book club',
  created_by: 'test-user-id',
  created_at: '2023-01-15T12:00:00Z',
  updated_at: '2023-01-15T12:00:00Z',
  member_count: 10,
  is_private: false,
  ...overrides
});

/**
 * Creates an event participant with default values
 * @param overrides Optional properties to override defaults
 * @returns An EventParticipant object
 */
export const createEventParticipant = (overrides: Partial<EventParticipant> = {}): EventParticipant => ({
  id: 'test-participant-id',
  event_id: 'test-event-id',
  user_id: 'test-user-id',
  status: 'going',
  created_at: '2023-07-05T12:00:00Z',
  updated_at: '2023-07-05T12:00:00Z',
  ...overrides
});



/**
 * Creates multiple events with sequential IDs
 * @param count Number of events to create
 * @param baseOverrides Base overrides to apply to all events
 * @returns Array of Event objects
 */
export const createEvents = (count: number, baseOverrides: Partial<Event> = {}): Event[] => {
  return Array.from({ length: count }, (_, index) =>
    createEvent({
      id: `test-event-id-${index + 1}`,
      title: `Test Event ${index + 1}`,
      ...baseOverrides
    })
  );
};
