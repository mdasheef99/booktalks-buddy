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
import StoreManagerEventManagementList from '@/components/store-manager/events/StoreManagerEventManagementList';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';

// Event filter types
type EventFilter = 'all' | 'upcoming' | 'past' | 'featured';
type EventSort = 'newest' | 'oldest' | 'upcoming';

/**
 * Store Manager Events Page Component
 * Displays and manages events for Store Managers with store-scoped access
 */
const StoreManagerEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isStoreManager, storeId, storeName, loading: storeAccessLoading } = useStoreManagerAccess();
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

  // Fetch events with store scoping
  const fetchEvents = useCallback(async () => {
    if (!user?.id || !storeId || !isStoreManager) return;

    try {
      setLoading(true);

      console.log('🏪 [Store Manager Events] Fetching events for store:', storeId);

      // Fetch events from the database with store scoping
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

      console.log('✅ [Store Manager Events] Fetched events:', fetchedEvents.length);
    } catch (error) {
      console.error('Error fetching store events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [user?.id, storeId, isStoreManager]);

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
    navigate('/store-manager/events/create');
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/store-manager/dashboard');
  };

  // Filter and search events
  const filteredEvents = React.useMemo(() => {
    let filtered = events;

    // Apply filter
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(e => new Date(e.start_time || e.date) > now);
        break;
      case 'past':
        filtered = filtered.filter(e => new Date(e.start_time || e.date) <= now);
        break;
      case 'featured':
        filtered = filtered.filter(e => e.featured_on_landing);
        break;
      case 'all':
      default:
        // No filtering
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query))
      );
    }

    // Apply sort
    switch (sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        break;
      case 'upcoming':
      default:
        filtered.sort((a, b) => new Date(a.start_time || a.date).getTime() - new Date(b.start_time || b.date).getTime());
        break;
    }

    return filtered;
  }, [events, filter, sort, searchQuery]);

  // Show loading state while checking store access
  if (storeAccessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-terracotta mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">
            Verifying Store Manager access...
          </p>
        </div>
      </div>
    );
  }

  // Show error if not a store manager
  if (!isStoreManager || !storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have Store Manager access to view events.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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

        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
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
        <div>
          <h1 className="text-3xl font-serif text-bookconnect-terracotta">Events Management</h1>
          <p className="text-gray-600 mt-1">
            Manage events for {storeName || 'your store'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
            title="Refresh events"
            data-testid="refresh-events-button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            onClick={handleCreateEvent}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 flex items-center gap-2"
            data-testid="create-event-button"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-2xl">{stats.totalEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Events</CardDescription>
            <CardTitle className="text-2xl">{stats.upcomingEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Past Events</CardDescription>
            <CardTitle className="text-2xl">{stats.pastEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Featured Events</CardDescription>
            <CardTitle className="text-2xl">{stats.featuredEvents}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-events-input"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={filter} onValueChange={(value: EventFilter) => setFilter(value)}>
            <SelectTrigger className="w-[140px]" data-testid="filter-events-select">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value: EventSort) => setSort(value)}>
            <SelectTrigger className="w-[140px]" data-testid="sort-events-select">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">By Date</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events List */}
      <StoreManagerEventManagementList
        events={filteredEvents}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default StoreManagerEventsPage;
