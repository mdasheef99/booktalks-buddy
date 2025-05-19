import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventCard from './EventCard';
import { Event } from '@/lib/supabase';

// Mock react-router-dom
const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock
}));

describe('EventCard', () => {
  // Setup test context
  const createMockEvent = (overrides = {}): Event => ({
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
  });

  const setup = (props = {}) => {
    const defaultProps = {
      event: createMockEvent()
    };

    const mergedProps = { ...defaultProps, ...props };
    const utils = render(<EventCard {...mergedProps} />);

    return {
      ...utils,
      event: mergedProps.event,
    };
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering tests
  describe('rendering', () => {
    it('displays event title and description', () => {
      const { event } = setup();

      expect(screen.getByText(event.title)).toBeInTheDocument();
      expect(screen.getByText(event.description)).toBeInTheDocument();
    });

    it('formats date and time correctly', () => {
      const event = createMockEvent({
        start_time: '2023-07-15T18:00:00Z',
        end_time: '2023-07-15T20:00:00Z',
      });

      setup({ event });

      // The exact format may vary based on locale, so we use regex patterns
      expect(screen.getByText(/july 15, 2023/i, { exact: false })).toBeInTheDocument();
    });

    it('displays event type badge', () => {
      const event = createMockEvent({ event_type: 'discussion' });
      setup({ event });

      expect(screen.getByText('Discussion')).toBeInTheDocument();
    });

    it('displays event location', () => {
      const event = createMockEvent({ location: 'Main Library' });
      setup({ event });

      expect(screen.getByText('Main Library')).toBeInTheDocument();
    });

    it('displays virtual badge for virtual events', () => {
      const event = createMockEvent({
        is_virtual: true,
        virtual_meeting_link: 'https://zoom.us/j/123456789'
      });
      setup({ event });

      expect(screen.getByText(/virtual/i)).toBeInTheDocument();
    });

    it('displays event image when available', () => {
      const event = createMockEvent({
        medium_url: 'https://example.com/image.jpg',
        image_alt_text: 'Event image'
      });

      setup({ event });

      const image = screen.getByAltText('Event image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });
  });

  // Interaction tests
  describe('interactions', () => {
    it('navigates to event details when view details button is clicked', async () => {
      const user = userEvent.setup();
      const { event } = setup();

      // Find and click the view details button
      const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
      await user.click(viewDetailsButton);

      expect(navigateMock).toHaveBeenCalledWith(`/events/${event.id}`);
    });
  });
});
