import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Plus,
  Search,
  RefreshCw,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/lib/api/bookclubs/events/types';
import { getStoreEvents } from '@/lib/api/bookclubs/events/queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EventManagementList from '@/components/admin/events/management';

// Event filter types
type EventFilter = 'all' | 'upcoming' | 'past' | 'featured';
type EventSort = 'newest' | 'oldest' | 'upcoming';

/**
 * Admin Events Page Component
 * Displays and manages events for store owners/managers
 */
const AdminEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventFilter>('upcoming');
  const [sort, setSort] = useState<EventSort>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    featuredEvents: 0,
    totalParticipants: 0
  });

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Use the actual store ID where the user is an administrator
      // This store ID is from the store_administrators table where the user is listed as an owner
      const storeId = 'ce76b99a-5f1a-481a-af85-862e584465e1';

      // Fetch events from the database
      const fetchedEvents = await getStoreEvents(user.id, storeId);

      setEvents(fetchedEvents);

      // Calculate stats
      const now = new Date();
      const upcoming = fetchedEvents.filter(e => new Date(e.start_time || e.date) > now);
      const past = fetchedEvents.filter(e => new Date(e.start_time || e.date) <= now);
      const featured = fetchedEvents.filter(e => e.featured_on_landing);

      // For total participants, in a real implementation you would fetch this data
      // For now, we'll just use a placeholder
      const totalParticipants = 0;

      setStats({
        totalEvents: fetchedEvents.length,
        upcomingEvents: upcoming.length,
        pastEvents: past.length,
        featuredEvents: featured.length,
        totalParticipants
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle create event
  const handleCreateEvent = () => {
    navigate('/admin/events/create');
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

  // Filter events based on search query and filter
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      searchQuery === '' ||
      (event.title && event.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const now = new Date();
    const eventDate = new Date(event.start_time || event.date);

    if (filter === 'all') return matchesSearch;
    if (filter === 'upcoming') return matchesSearch && eventDate > now;
    if (filter === 'past') return matchesSearch && eventDate <= now;
    if (filter === 'featured') return matchesSearch && !!event.featured_on_landing;

    return matchesSearch;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sort === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    // Default: upcoming
    return new Date(a.start_time || a.date).getTime() - new Date(b.start_time || b.date).getTime();
  });

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={handleBackToDashboard}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">Events Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={handleBackToDashboard}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-bookconnect-brown">Events Management</h1>

        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
            title="Refresh events"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            onClick={handleCreateEvent}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-3xl">{stats.totalEvents}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Events</CardDescription>
            <CardTitle className="text-3xl">{stats.upcomingEvents}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Featured Events</CardDescription>
            <CardTitle className="text-3xl">{stats.featuredEvents}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Participants</CardDescription>
            <CardTitle className="text-3xl">{stats.totalParticipants}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search events..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={filter} onValueChange={(value) => setFilter(value as EventFilter)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter events" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="upcoming">Upcoming Events</SelectItem>
              <SelectItem value="past">Past Events</SelectItem>
              <SelectItem value="featured">Featured Events</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value) => setSort(value as EventSort)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort events" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">By Date (Upcoming)</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events List */}
      <EventManagementList
        events={sortedEvents}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default AdminEventsPage;
