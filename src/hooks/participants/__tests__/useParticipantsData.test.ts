/**
 * Tests for the useParticipantsData hook
 *
 * This file tests the useParticipantsData hook functionality, including:
 * - Initial loading state
 * - Successful data fetching
 * - Error handling
 * - Data manipulation
 * - Callback handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor, act } from '@testing-library/react';

// Import types
import { Participant, ParticipantCounts, RsvpStatus } from '@/components/admin/events/participants/types';

// Import the hook directly
import { useParticipantsData } from '../useParticipantsData';

// Mock the API functions
vi.mock('@/lib/api/bookclubs/participants', () => ({
  getEventParticipants: vi.fn(),
  getEventParticipantCounts: vi.fn()
}));

// Import the mocked modules
import { getEventParticipants, getEventParticipantCounts } from '@/lib/api/bookclubs/participants';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Import the mocked toast
import { toast } from 'sonner';

// Helper function to create a mock participant
function createMockParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    event_id: 'test-event-id',
    user_id: 'test-user-id',
    rsvp_status: 'going' as RsvpStatus,
    rsvp_at: '2023-01-01T12:00:00Z',
    user: {
      username: 'testuser',
      email: 'test@example.com'
    },
    ...overrides
  };
}

// Helper function to create mock participant counts
function createMockCounts(overrides: Partial<ParticipantCounts> = {}): ParticipantCounts {
  return {
    going: 5,
    maybe: 3,
    not_going: 2,
    total: 10,
    ...overrides
  };
}

describe('useParticipantsData hook', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test with empty options
  it('should handle empty options gracefully', () => {
    // Mock API responses
    vi.mocked(getEventParticipants).mockResolvedValue([]);
    vi.mocked(getEventParticipantCounts).mockResolvedValue({ going: 0, maybe: 0, not_going: 0 });

    const { result } = renderHook(() => useParticipantsData({}));

    // Verify initial state
    expect(result.current.participants).toEqual([]);
    expect(result.current.counts).toEqual({ going: 0, maybe: 0, not_going: 0, total: 0 });
  });

  // Test with initial participants
  it('should initialize with provided initial participants', () => {
    const initialParticipants = [
      createMockParticipant({ user_id: 'user-1', rsvp_status: 'going' }),
      createMockParticipant({ user_id: 'user-2', rsvp_status: 'maybe' })
    ];

    const { result } = renderHook(() =>
      useParticipantsData({ initialParticipants })
    );

    // Verify initial state
    expect(result.current.participants).toEqual(initialParticipants);
    expect(result.current.counts).toEqual({ going: 1, maybe: 1, not_going: 0, total: 2 });
  });

  // Test with initial counts
  it('should initialize with provided initial counts', () => {
    const initialCounts = createMockCounts();

    const { result } = renderHook(() =>
      useParticipantsData({ initialCounts })
    );

    // Verify initial state
    expect(result.current.counts).toEqual(initialCounts);
  });

  // Test successful data fetching
  it('should fetch participants data when eventId is provided', async () => {
    // Mock API responses
    const mockParticipants = [
      createMockParticipant({ user_id: 'user-1', rsvp_status: 'going' }),
      createMockParticipant({ user_id: 'user-2', rsvp_status: 'maybe' })
    ];
    const mockCounts = createMockCounts({ going: 1, maybe: 1, not_going: 0, total: 2 });

    vi.mocked(getEventParticipants).mockResolvedValue(mockParticipants);
    vi.mocked(getEventParticipantCounts).mockResolvedValue({
      going: mockCounts.going,
      maybe: mockCounts.maybe,
      not_going: mockCounts.not_going
    });

    const { result } = renderHook(() =>
      useParticipantsData({ eventId: 'test-event-id' })
    );

    // Call fetchInitialData manually
    await act(async () => {
      await result.current.fetchInitialData();
    });

    // Verify API was called
    expect(getEventParticipants).toHaveBeenCalledWith('test-event-id');
    expect(getEventParticipantCounts).toHaveBeenCalledWith('test-event-id');

    // Verify state was updated
    expect(result.current.participants).toEqual(mockParticipants);
    expect(result.current.counts).toEqual(mockCounts);
  });

  // Test error handling
  it('should handle errors when fetching participants fails', async () => {
    // Mock API to throw error
    const mockError = new Error('Failed to fetch participants');
    vi.mocked(getEventParticipants).mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useParticipantsData({ eventId: 'test-event-id', showToasts: true })
    );

    // Call fetchInitialData manually
    await act(async () => {
      await result.current.fetchInitialData();
    });

    // Verify error toast was shown
    expect(toast.error).toHaveBeenCalledWith('Failed to load participant data');
  });

  // Test onDataChange callback with setParticipants
  it('should call onDataChange when participants are set directly', async () => {
    // Mock callback
    const mockOnDataChange = vi.fn();

    // Create mock participants
    const mockParticipants = [createMockParticipant()];

    // Create initial state
    const { result } = renderHook(() =>
      useParticipantsData({
        onDataChange: mockOnDataChange
      })
    );

    // Directly set participants to trigger the effect
    act(() => {
      result.current.setParticipants(mockParticipants);
    });

    // Verify callback was called with the participants
    expect(mockOnDataChange).toHaveBeenCalledWith(mockParticipants);
  });

  // Test onCountsChange callback with setCounts
  it('should call onCountsChange when counts are set directly', async () => {
    // Mock callback
    const mockOnCountsChange = vi.fn();

    // Create initial state
    const { result } = renderHook(() =>
      useParticipantsData({
        onCountsChange: mockOnCountsChange
      })
    );

    // Directly set counts to trigger the effect
    act(() => {
      result.current.setCounts({
        going: 1,
        maybe: 1,
        not_going: 0,
        total: 2
      });
    });

    // Verify callback was called with the counts
    expect(mockOnCountsChange).toHaveBeenCalledWith({
      going: 1,
      maybe: 1,
      not_going: 0,
      total: 2
    });
  });

  // Test with initial participants and onCountsChange
  it('should calculate counts from initial participants and call onCountsChange', () => {
    // Mock callback
    const mockOnCountsChange = vi.fn();

    // Setup initial participants
    const initialParticipants = [
      createMockParticipant({ user_id: 'user-1', rsvp_status: 'going' }),
      createMockParticipant({ user_id: 'user-2', rsvp_status: 'maybe' }),
      createMockParticipant({ user_id: 'user-3', rsvp_status: 'not_going' })
    ];

    renderHook(() =>
      useParticipantsData({
        initialParticipants,
        onCountsChange: mockOnCountsChange
      })
    );

    // Verify callback was called with the calculated counts
    expect(mockOnCountsChange).toHaveBeenCalledWith({
      going: 1,
      maybe: 1,
      not_going: 1,
      total: 3
    });
  });
});
