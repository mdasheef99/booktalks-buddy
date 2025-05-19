import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventList from './EventList';
import { Event } from '@/lib/supabase';

// Mock the EventCard component
vi.mock('./EventCard', () => ({
  default: ({ event }: { event: Event }) => (
    <div data-testid={`event-card-${event.id}`}>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
    </div>
  )
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('EventList', () => {
  // Create mock events for testing
  const createMockEvent = (id: string, overrides = {}): Event => ({
    id,
    title: `Event ${id}`,
    description: `Description for event ${id}`,
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
  });

  const mockEvents = [
    createMockEvent('1'),
    createMockEvent('2'),
    createMockEvent('3')
  ];

  // Setup test context
  const setup = (props = {}) => {
    const defaultProps = {
      events: mockEvents,
      isLoading: false,
      isError: false,
      emptyMessage: 'No events found',
      errorMessage: 'Failed to load events'
    };

    const mergedProps = { ...defaultProps, ...props };
    const utils = render(<EventList {...mergedProps} />);

    return {
      ...utils,
      events: mergedProps.events,
    };
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering tests
  describe('rendering', () => {
    it('renders a list of event cards when events are provided', () => {
      setup();

      // Check that all events are rendered
      mockEvents.forEach(event => {
        expect(screen.getByTestId(`event-card-${event.id}`)).toBeInTheDocument();
        expect(screen.getByText(event.title)).toBeInTheDocument();
        expect(screen.getByText(event.description)).toBeInTheDocument();
      });
    });

    it('displays loading state when isLoading is true', () => {
      setup({ isLoading: true });

      // Look for skeleton elements by their class
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays error message when isError is true', () => {
      const errorMessage = 'Custom error message';
      setup({ isError: true, errorMessage });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('displays empty message when events array is empty', () => {
      const emptyMessage = 'Custom empty message';
      setup({ events: [], emptyMessage });

      expect(screen.getByText(emptyMessage)).toBeInTheDocument();
    });

    it('displays empty message when events is null', () => {
      const emptyMessage = 'Custom empty message';
      setup({ events: null as unknown as Event[], emptyMessage });

      expect(screen.getByText(emptyMessage)).toBeInTheDocument();
    });
  });
});
