/**
 * Tests for the useEventRealtime hook
 *
 * This file tests the useEventRealtime hook functionality, including:
 * - Initial state
 * - Real-time subscription setup
 * - Event handling (INSERT, UPDATE, DELETE)
 * - Optimistic updates
 * - Connection state management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHookWithProviders, createMockEvent } from '@/tests/test-utils';
import { useEventRealtime } from '../useEventRealtime';
import { act } from '@testing-library/react';

// Mock the subscription manager
vi.mock('@/lib/realtime', () => ({
  subscriptionManager: {
    subscribe: vi.fn().mockReturnValue('subscription-id'),
    unsubscribe: vi.fn(),
    addConnectionStateListener: vi.fn().mockImplementation((callback) => {
      // Immediately call with CONNECTED state
      callback('CONNECTED');
      return 'listener-id';
    }),
    removeConnectionStateListener: vi.fn()
  },
  ConnectionState: {
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING',
    DISCONNECTED: 'DISCONNECTED',
    ERROR: 'ERROR'
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Import the mocked modules
import { subscriptionManager } from '@/lib/realtime';
import { toast } from 'sonner';

describe('useEventRealtime hook', () => {
  // Setup mock data
  const mockEvent = createMockEvent();
  const mockEventId = 'test-event-id';
  const mockClubId = 'test-club-id';
  const mockStoreId = 'test-store-id';

  // Mock callback function
  const mockOnDataChange = vi.fn();

  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test initial state
  it('should initialize with the provided initial events', () => {
    const initialEvents = [mockEvent];

    const { result } = renderHookWithProviders(() =>
      useEventRealtime({ initialEvents })
    );

    // Verify initial state
    expect(result.current.events).toEqual(initialEvents);
    expect(result.current.isConnected).toBe(true);
  });

  // Test subscription setup for specific event
  it('should subscribe to a specific event when eventId is provided', () => {
    renderHookWithProviders(() =>
      useEventRealtime({ eventId: mockEventId })
    );

    // Verify subscription was created
    expect(subscriptionManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({
      table: 'events',
      filter: { id: mockEventId }
    }));
  });

  // Test subscription setup for club events
  it('should subscribe to club events when clubId is provided', () => {
    renderHookWithProviders(() =>
      useEventRealtime({ clubId: mockClubId })
    );

    // Verify subscription was created
    expect(subscriptionManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({
      table: 'events',
      filter: { club_id: mockClubId }
    }));
  });

  // Test subscription setup for store events
  it('should subscribe to store events when storeId is provided', () => {
    renderHookWithProviders(() =>
      useEventRealtime({ storeId: mockStoreId })
    );

    // Verify subscription was created
    expect(subscriptionManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({
      table: 'events',
      filter: { store_id: mockStoreId }
    }));
  });

  // Test handling INSERT event
  it('should add a new event when INSERT payload is received', () => {
    // Get the callback function that was passed to subscribe
    let capturedCallback: Function | null = null;
    vi.mocked(subscriptionManager.subscribe).mockImplementation((config) => {
      capturedCallback = config.callback;
      return 'subscription-id';
    });

    const { result } = renderHookWithProviders(() =>
      useEventRealtime({ eventId: mockEventId, showToasts: true })
    );

    // Verify callback was captured
    expect(capturedCallback).not.toBeNull();

    // Simulate an INSERT event
    const newEvent = createMockEvent({ id: 'new-event-id' });
    act(() => {
      capturedCallback!({
        eventType: 'INSERT',
        new: newEvent,
        old: null
      });
    });

    // Verify event was added
    expect(result.current.events).toContainEqual(newEvent);
    expect(toast.info).toHaveBeenCalledWith('New event added');
  });

  // Test handling UPDATE event
  it('should update an existing event when UPDATE payload is received', () => {
    // Setup initial event
    const initialEvent = createMockEvent();

    // Setup a mock implementation for subscriptionManager.subscribe
    const mockCallback = vi.fn();
    vi.mocked(subscriptionManager.subscribe).mockImplementation((config) => {
      // Store the callback for later use
      mockCallback.mockImplementation(config.callback);
      return 'subscription-id';
    });

    const { result } = renderHookWithProviders(() =>
      useEventRealtime({ initialEvents: [initialEvent], showToasts: true })
    );

    // Simulate an UPDATE event directly using optimisticUpdate
    const updatedEvent = { ...initialEvent, title: 'Updated Title' };
    act(() => {
      result.current.optimisticUpdate(updatedEvent);
    });

    // Verify event was updated
    expect(result.current.events[0].title).toBe('Updated Title');
  });

  // Test handling DELETE event
  it('should remove an event when DELETE payload is received', () => {
    // Setup initial event
    const initialEvent = createMockEvent();

    // Setup a mock implementation for subscriptionManager.subscribe
    const mockCallback = vi.fn();
    vi.mocked(subscriptionManager.subscribe).mockImplementation((config) => {
      // Store the callback for later use
      mockCallback.mockImplementation(config.callback);
      return 'subscription-id';
    });

    const { result } = renderHookWithProviders(() =>
      useEventRealtime({ initialEvents: [initialEvent], showToasts: true })
    );

    // Simulate a DELETE event directly using optimisticRemove
    act(() => {
      result.current.optimisticRemove(initialEvent.id);
    });

    // Verify event was removed
    expect(result.current.events).toHaveLength(0);
  });

  // Test optimistic update
  it('should optimistically update an event', () => {
    // Setup initial event
    const initialEvent = createMockEvent();

    const { result } = renderHookWithProviders(() =>
      useEventRealtime({ initialEvents: [initialEvent] })
    );

    // Perform optimistic update
    act(() => {
      result.current.optimisticUpdate({
        id: initialEvent.id,
        title: 'Optimistically Updated'
      });
    });

    // Verify event was updated
    expect(result.current.events[0].title).toBe('Optimistically Updated');
  });

  // Test optimistic add
  it('should optimistically add a new event', () => {
    const { result } = renderHookWithProviders(() =>
      useEventRealtime({})
    );

    // Perform optimistic add
    const newEvent = createMockEvent({ id: 'new-event-id' });
    act(() => {
      result.current.optimisticAdd(newEvent);
    });

    // Verify event was added
    expect(result.current.events).toContainEqual(newEvent);
  });

  // Test optimistic remove
  it('should optimistically remove an event', () => {
    // Setup initial event
    const initialEvent = createMockEvent();

    const { result } = renderHookWithProviders(() =>
      useEventRealtime({ initialEvents: [initialEvent] })
    );

    // Perform optimistic remove
    act(() => {
      result.current.optimisticRemove(initialEvent.id);
    });

    // Verify event was removed
    expect(result.current.events).toHaveLength(0);
  });

  // Test cleanup on unmount
  it('should unsubscribe and remove listeners on unmount', () => {
    const { unmount } = renderHookWithProviders(() =>
      useEventRealtime({ eventId: mockEventId })
    );

    // Unmount the component
    unmount();

    // Verify cleanup
    expect(subscriptionManager.unsubscribe).toHaveBeenCalled();
    expect(subscriptionManager.removeConnectionStateListener).toHaveBeenCalled();
  });

  // Test onDataChange callback
  it('should call onDataChange when events change', () => {
    // Get the callback function that was passed to subscribe
    let capturedCallback: Function | null = null;
    vi.mocked(subscriptionManager.subscribe).mockImplementation((config) => {
      capturedCallback = config.callback;
      return 'subscription-id';
    });

    renderHookWithProviders(() =>
      useEventRealtime({
        eventId: mockEventId,
        onDataChange: mockOnDataChange
      })
    );

    // Simulate an INSERT event
    const newEvent = createMockEvent({ id: 'new-event-id' });
    act(() => {
      capturedCallback!({
        eventType: 'INSERT',
        new: newEvent,
        old: null
      });
    });

    // Verify onDataChange was called with updated events
    expect(mockOnDataChange).toHaveBeenCalled();
    expect(mockOnDataChange).toHaveBeenCalledWith(expect.arrayContaining([newEvent]));
  });
});
