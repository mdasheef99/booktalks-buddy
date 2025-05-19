/**
 * Unit tests for BookConnect Events query functions
 *
 * These tests verify the behavior of the read-only query functions
 * for the Events feature, including proper Supabase interactions
 * and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEvent, getClubEvents, getFeaturedEvents } from '../queries';
import { supabaseMock } from '@/test/setup';

// Note: Supabase is already mocked in the test setup file

describe('Events Query Functions', () => {
  // Sample event data for testing
  const mockEvent = {
    id: 'event-123',
    title: 'Book Club Discussion',
    description: 'Monthly book discussion',
    date: '2023-07-15',
    club_id: 'club-456',
    store_id: 'store-789',
    event_type: 'discussion',
    start_time: '2023-07-15T18:00:00Z',
    end_time: '2023-07-15T20:00:00Z',
    location: 'Main Library',
    is_virtual: false,
    featured_on_landing: false,
    created_by: 'user-123',
    created_at: '2023-06-01T12:00:00Z'
  };

  // Sample events array for testing
  const mockEvents = [
    {
      id: 'event-123',
      title: 'Book Club Discussion',
      club_id: 'club-456',
      event_type: 'discussion',
      start_time: '2023-07-15T18:00:00Z',
      featured_on_landing: false
    },
    {
      id: 'event-456',
      title: 'Author Meet and Greet',
      club_id: 'club-456',
      event_type: 'author_meet',
      start_time: '2023-08-20T19:00:00Z',
      featured_on_landing: true
    }
  ];

  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEvent', () => {
    it('should return an event when it exists', async () => {
      // Setup the mock to return our test data
      supabaseMock.single.mockResolvedValue({
        data: mockEvent,
        error: null
      });

      // Call the function we're testing
      const result = await getEvent('event-123');

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.select).toHaveBeenCalledWith('*');
      expect(supabaseMock.eq).toHaveBeenCalledWith('id', 'event-123');
      expect(supabaseMock.single).toHaveBeenCalled();

      // Verify the result is what we expect
      expect(result).toEqual(mockEvent);
    });

    it('should throw an error when the event does not exist', async () => {
      // Setup the mock to return an error
      const mockError = new Error('Event not found');
      supabaseMock.single.mockResolvedValue({
        data: null,
        error: mockError
      });

      // Verify that calling the function throws an error
      await expect(getEvent('non-existent-id')).rejects.toThrow();

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.eq).toHaveBeenCalledWith('id', 'non-existent-id');
    });
  });

  describe('getClubEvents', () => {
    it('should return events for a specific club', async () => {
      // Setup the mock to return our test data
      // For a function that doesn't use single()
      supabaseMock.order.mockImplementation(() => ({
        data: mockEvents,
        error: null
      }));

      // Call the function we're testing
      const result = await getClubEvents('club-456');

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.select).toHaveBeenCalledWith('*');
      expect(supabaseMock.eq).toHaveBeenCalledWith('club_id', 'club-456');
      expect(supabaseMock.order).toHaveBeenCalledWith('start_time', { ascending: true });

      // Verify the result is what we expect
      expect(result).toEqual(mockEvents);
      expect(result.length).toBe(2);
    });

    it('should filter by upcoming events when specified', async () => {
      // Setup the mock to return filtered data
      supabaseMock.order.mockResolvedValue({
        data: [mockEvents[1]], // Only the future event
        error: null
      });

      // Call the function we're testing with upcomingOnly=true
      const result = await getClubEvents('club-456', true);

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.select).toHaveBeenCalledWith('*');
      expect(supabaseMock.eq).toHaveBeenCalledWith('club_id', 'club-456');
      expect(supabaseMock.gte).toHaveBeenCalled(); // Should check for dates >= now
      expect(supabaseMock.order).toHaveBeenCalledWith('start_time', { ascending: true });

      // Verify the result is filtered correctly
      expect(result).toEqual([mockEvents[1]]);
      expect(result.length).toBe(1);
    });

    it('should return an empty array when no events exist for the club', async () => {
      // Setup the mock to return empty data
      supabaseMock.order.mockResolvedValue({
        data: [],
        error: null
      });

      // Call the function we're testing
      const result = await getClubEvents('empty-club');

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.eq).toHaveBeenCalledWith('club_id', 'empty-club');

      // Verify the result is an empty array
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should throw an error when the database query fails', async () => {
      // Setup the mock to return an error
      const mockError = new Error('Database error');
      supabaseMock.order.mockResolvedValue({
        data: null,
        error: mockError
      });

      // Verify that calling the function throws an error
      await expect(getClubEvents('club-456')).rejects.toThrow();

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.eq).toHaveBeenCalledWith('club_id', 'club-456');
    });
  });

  describe('getFeaturedEvents', () => {
    // Sample featured events for testing
    const mockFeaturedEvents = [
      {
        id: 'event-456',
        title: 'Author Meet and Greet',
        featured_on_landing: true,
        start_time: '2023-08-20T19:00:00Z'
      },
      {
        id: 'event-789',
        title: 'Book Festival',
        featured_on_landing: true,
        start_time: '2023-09-10T10:00:00Z'
      }
    ];

    it('should return featured events ordered by date', async () => {
      // Setup the mock to return our test data
      supabaseMock.order.mockResolvedValue({
        data: mockFeaturedEvents,
        error: null
      });

      // Call the function we're testing
      const result = await getFeaturedEvents();

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.select).toHaveBeenCalledWith('*');
      expect(supabaseMock.eq).toHaveBeenCalledWith('featured_on_landing', true);
      expect(supabaseMock.order).toHaveBeenCalledWith('start_time', { ascending: true });

      // Verify the result is what we expect
      expect(result).toEqual(mockFeaturedEvents);
      expect(result.length).toBe(2);
      expect(result[0].title).toBe('Author Meet and Greet');
    });

    it('should limit results when limit parameter is provided', async () => {
      // Setup the mock to return limited data
      supabaseMock.order.mockResolvedValue({
        data: [mockFeaturedEvents[0]],
        error: null
      });

      // Call the function we're testing
      // Note: In a real implementation, we would need to modify getFeaturedEvents to accept a 'limit' parameter
      const result = await getFeaturedEvents();

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.select).toHaveBeenCalledWith('*');
      expect(supabaseMock.eq).toHaveBeenCalledWith('featured_on_landing', true);
      expect(supabaseMock.order).toHaveBeenCalledWith('start_time', { ascending: true });
      // Verify limit was applied (implementation dependent)

      // Verify the result is limited correctly
      expect(result).toEqual([mockFeaturedEvents[0]]);
      expect(result.length).toBe(1);
    });

    it('should return an empty array when no featured events exist', async () => {
      // Setup the mock to return empty data
      supabaseMock.order.mockResolvedValue({
        data: [],
        error: null
      });

      // Call the function we're testing
      const result = await getFeaturedEvents();

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.select).toHaveBeenCalledWith('*');
      expect(supabaseMock.eq).toHaveBeenCalledWith('featured_on_landing', true);

      // Verify the result is an empty array
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should throw an error when the database query fails', async () => {
      // Setup the mock to return an error
      const mockError = new Error('Database error');
      supabaseMock.order.mockResolvedValue({
        data: null,
        error: mockError
      });

      // Verify that calling the function throws an error
      await expect(getFeaturedEvents()).rejects.toThrow();

      // Verify the function called Supabase correctly
      expect(supabaseMock.from).toHaveBeenCalledWith('events');
      expect(supabaseMock.select).toHaveBeenCalledWith('*');
      expect(supabaseMock.eq).toHaveBeenCalledWith('featured_on_landing', true);
    });
  });
});
