/**
 * Tests for the useEvents hook
 *
 * This file tests the useEvents hook functionality, including:
 * - Initial loading state
 * - Successful data fetching
 * - Error handling
 * - Filtering and sorting
 * - Real-time updates
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHookWithProviders, createMockEvent } from '@/tests/test-utils';
import { useEvents } from '../useEvents';
import { waitFor } from '@testing-library/react';

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    clubRoles: {},
    entitlements: []
  })
}));

// Mock the API functions
vi.mock('@/lib/api/bookclubs/events/queries', () => ({
  getClubEvents: vi.fn(),
  getFeaturedEvents: vi.fn()
}));

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        })),
        data: [],
        error: null
      }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({
          unsubscribe: vi.fn()
        }))
      }))
    }))
  }
}));

// Import the mocked modules
import { getClubEvents, getFeaturedEvents } from '@/lib/api/bookclubs/events/queries';
import { supabase } from '@/lib/supabase';

// Helper function to create multiple mock events
function createMockEvents(count: number = 3, baseOverrides = {}): any[] {
  return Array.from({ length: count }, (_, index) =>
    createMockEvent({
      id: `test-event-id-${index + 1}`,
      title: `Test Event ${index + 1}`,
      ...baseOverrides
    })
  );
}

describe('useEvents hook', () => {
  // Setup mock data
  const mockEvents = createMockEvents(3);
  const mockFeaturedEvents = createMockEvents(2, { featured_on_landing: true });
  const mockClubEvents = createMockEvents(2, { club_id: 'test-club-id' });

  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(getFeaturedEvents).mockResolvedValue(mockFeaturedEvents);
    vi.mocked(getClubEvents).mockResolvedValue(mockClubEvents);

    // Mock Supabase from().select() to return all events
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        data: mockEvents,
        error: null
      })
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test initial loading state
  it('should start with loading state', async () => {
    const { result } = renderHookWithProviders(() => useEvents());

    // Initial state should be loading
    expect(result.current.loading).toBe(true);

    // Wait for loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  // Test successful data fetching
  it('should fetch all events by default', async () => {
    const { result } = renderHookWithProviders(() => useEvents());

    // Wait for loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify events are loaded
    expect(result.current.events).toHaveLength(mockEvents.length);
    expect(supabase.from).toHaveBeenCalledWith('events');
  });

  // Test featured events filter
  it('should fetch featured events when filter is set to featured', async () => {
    const { result } = renderHookWithProviders(() => useEvents('featured'));

    // Wait for loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify featured events are loaded
    expect(result.current.events).toHaveLength(mockFeaturedEvents.length);
    expect(getFeaturedEvents).toHaveBeenCalled();
  });

  // Test my-clubs filter
  it('should fetch club events when filter is set to my-clubs', async () => {
    // Mock the Supabase response for club_members query
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'club_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              data: [{ club_id: 'test-club-id' }],
              error: null
            })
          })
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          data: mockEvents,
          error: null
        })
      };
    });

    const { result } = renderHookWithProviders(() => useEvents('my-clubs'));

    // Wait for loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify club events are loaded
    expect(getClubEvents).toHaveBeenCalledWith('test-club-id');
  });

  // Test error handling
  it('should handle errors when fetching events fails', async () => {
    // Mock Supabase to throw an error
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        data: null,
        error: new Error('Failed to fetch events')
      })
    }));

    const { result } = renderHookWithProviders(() => useEvents());

    // Wait for loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify error state
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch events');
  });

  // Test filtering events
  it('should filter events by upcoming', async () => {
    // Create events with different dates
    const pastEvent = createMockEvent({
      id: 'past-event',
      start_time: '2020-01-01T10:00:00Z',
      date: '2020-01-01'
    });

    const futureEvent = createMockEvent({
      id: 'future-event',
      start_time: '2030-01-01T10:00:00Z',
      date: '2030-01-01'
    });

    const mixedEvents = [pastEvent, futureEvent];

    // Mock Supabase to return mixed events
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        data: mixedEvents,
        error: null
      })
    }));

    const { result } = renderHookWithProviders(() => useEvents('upcoming'));

    // Wait for loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify only future events are included
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe('future-event');
  });

  // Test sorting events
  it('should sort events by newest when sort is set to newest', async () => {
    // Create events with different creation dates
    const oldEvent = createMockEvent({
      id: 'old-event',
      created_at: '2020-01-01T10:00:00Z'
    });

    const newEvent = createMockEvent({
      id: 'new-event',
      created_at: '2023-01-01T10:00:00Z'
    });

    const events = [oldEvent, newEvent];

    // Mock Supabase to return events
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        data: events,
        error: null
      })
    }));

    const { result } = renderHookWithProviders(() => useEvents('all', 'newest'));

    // Wait for loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify events are sorted by newest first
    expect(result.current.events[0].id).toBe('new-event');
    expect(result.current.events[1].id).toBe('old-event');
  });

  // Test refresh functionality
  it('should refresh events when refresh function is called', async () => {
    const { result } = renderHookWithProviders(() => useEvents());

    // Wait for initial loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Reset the mock to track new calls
    vi.mocked(supabase.from).mockClear();

    // Call refresh
    result.current.refresh();

    // Verify Supabase was called again
    expect(supabase.from).toHaveBeenCalledWith('events');
  });
});
