/**
 * Mock implementation of useEventNotifications hook for testing
 */
import { useState } from 'react';

export function useEventNotifications() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to manually refresh the count
  const refreshCount = () => {
    // Mock implementation
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
