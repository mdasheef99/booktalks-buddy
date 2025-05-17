import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { getClubEvents, getFeaturedEvents } from '@/lib/api/bookclubs/events';

// Filter options for events
export type EventFilter = 'all' | 'upcoming' | 'past' | 'featured' | 'my-clubs';

// Sort options for events
export type EventSort = 'newest' | 'oldest' | 'upcoming' | 'club';

/**
 * Custom hook to fetch and filter events
 */
export function useEvents(initialFilter: EventFilter = 'all', initialSort: EventSort = 'upcoming') {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<EventFilter>(initialFilter);
  const [sort, setSort] = useState<EventSort>(initialSort);
  const [userClubs, setUserClubs] = useState<string[]>([]);

  // Fetch user's clubs
  useEffect(() => {
    const fetchUserClubs = async () => {
      if (!user?.id) {
        setUserClubs([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('club_members')
          .select('club_id')
          .eq('user_id', user.id);

        if (error) throw error;
        setUserClubs(data.map(item => item.club_id));
      } catch (err) {
        console.error('Error fetching user clubs:', err);
      }
    };

    fetchUserClubs();
  }, [user?.id]);

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      let fetchedEvents: Event[] = [];
      
      // Fetch different events based on filter
      if (filter === 'featured') {
        fetchedEvents = await getFeaturedEvents();
      } else if (filter === 'my-clubs' && userClubs.length > 0) {
        // Fetch events for user's clubs
        const clubEventsPromises = userClubs.map(clubId => getClubEvents(clubId));
        const clubEventsArrays = await Promise.all(clubEventsPromises);
        fetchedEvents = clubEventsArrays.flat();
      } else {
        // Fetch all events
        const { data, error } = await supabase
          .from('events')
          .select('*');
          
        if (error) throw error;
        fetchedEvents = data;
      }
      
      setEvents(fetchedEvents);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    // Apply filters
    let filtered = [...events];
    
    if (filter === 'upcoming') {
      const now = new Date();
      filtered = filtered.filter(event => {
        const eventDate = event.start_time ? new Date(event.start_time) : new Date(event.date);
        return eventDate >= now;
      });
    } else if (filter === 'past') {
      const now = new Date();
      filtered = filtered.filter(event => {
        const eventDate = event.start_time ? new Date(event.start_time) : new Date(event.date);
        return eventDate < now;
      });
    } else if (filter === 'my-clubs') {
      filtered = filtered.filter(event => event.club_id && userClubs.includes(event.club_id));
    }
    
    // Apply sorting
    if (sort === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else if (sort === 'upcoming') {
      filtered.sort((a, b) => {
        const dateA = a.start_time ? new Date(a.start_time) : new Date(a.date);
        const dateB = b.start_time ? new Date(b.start_time) : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sort === 'club') {
      filtered.sort((a, b) => {
        if (a.club_id && !b.club_id) return -1;
        if (!a.club_id && b.club_id) return 1;
        return 0;
      });
    }
    
    setFilteredEvents(filtered);
  }, [events, filter, sort, userClubs]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('events_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, () => {
        // Refetch events when changes occur
        fetchEvents();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [filter, userClubs.length]);

  return {
    events: filteredEvents,
    loading,
    error,
    filter,
    setFilter,
    sort,
    setSort,
    refresh: fetchEvents
  };
}
