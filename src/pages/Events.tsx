
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/hooks/useEvents";
import { useEventNotifications } from "@/hooks/useEventNotifications";
import EventList from "@/components/events/EventList";
import EventFilters from "@/components/events/EventFilters";
import { markAllEventNotificationsAsRead } from "@/lib/api/bookclubs/notifications";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

/**
 * Enhanced Events page with filtering, sorting, and notification handling
 */
const Events = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    events,
    loading,
    error,
    filter,
    setFilter,
    sort,
    setSort,
    refresh
  } = useEvents('upcoming', 'upcoming');

  const { unreadCount, markAllAsRead } = useEventNotifications();

  // Mark all notifications as read when the page loads
  useEffect(() => {
    if (user?.id && unreadCount > 0) {
      const markNotificationsAsRead = async () => {
        try {
          await markAllEventNotificationsAsRead(user.id);
          markAllAsRead();
        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
      };

      markNotificationsAsRead();
    }
  }, [user?.id, unreadCount]);

  // Handle refresh button click
  const handleRefresh = () => {
    refresh();
    toast.success('Events refreshed');
  };

  // Handle back to home navigation
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Button
            onClick={handleBackToHome}
            variant="ghost"
            className="text-bookconnect-brown hover:text-bookconnect-terracotta hover:bg-bookconnect-brown/5 p-2"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4 md:mb-0">Events</h1>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="text-bookconnect-terracotta hover:bg-bookconnect-terracotta/10"
          >
            Refresh Events
          </Button>
        </div>

        <EventFilters
          filter={filter}
          setFilter={setFilter}
          sort={sort}
          setSort={setSort}
          className="mb-8"
        />

        <EventList
          events={events}
          isLoading={loading}
          isError={!!error}
          emptyMessage={
            filter === 'my-clubs'
              ? "No events found for your book clubs. Join more clubs to see their events!"
              : filter === 'featured'
                ? "No featured events at the moment. Check back later!"
                : "No events found. Check back later for upcoming events!"
          }
        />
      </div>
    </div>
  );
};

export default Events;
