import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUnreadEventNotificationsCount, 
  subscribeToEventNotifications,
  EventNotification
} from '@/lib/api/bookclubs/notifications';

/**
 * Custom hook to fetch and track unread event notifications
 * Includes real-time updates using Supabase subscriptions
 */
export function useEventNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const count = await getUnreadEventNotificationsCount(user.id);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      console.error('Error fetching unread notifications count:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for new notifications
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Only set up subscription if user is authenticated
    if (!user?.id) return;

    // Handle new notifications
    const handleNewNotification = (notification: EventNotification) => {
      // If the notification is not read, increment the count
      if (!notification.is_read) {
        setUnreadCount(prevCount => prevCount + 1);
      }
    };

    // Subscribe to real-time updates
    const subscription = subscribeToEventNotifications(user.id, handleNewNotification);

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Function to manually refresh the count
  const refreshCount = () => {
    fetchUnreadCount();
  };

  // Function to mark all as read (updates UI immediately)
  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  return {
    unreadCount,
    loading,
    error,
    refreshCount,
    markAllAsRead
  };
}
