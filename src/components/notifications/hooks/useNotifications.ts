/**
 * React hook for managing notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsAsRead,
  updateNotification,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} from '@/lib/api/notifications/operations';
import {
  subscribeToUserNotifications,
  playNotificationSound,
  showBrowserNotification
} from '@/lib/api/notifications/realtime';
import {
  BookConnectNotification,
  NotificationFilters,
  NotificationPreferences
} from '@/lib/api/notifications/types';

interface UseNotificationsOptions extends NotificationFilters {
  enableRealtime?: boolean;
  enableSound?: boolean;
  enableBrowserNotifications?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNotifications(
  userId: string | undefined,
  options: UseNotificationsOptions = {}
) {
  const queryClient = useQueryClient();
  const [realtimeSubscription, setRealtimeSubscription] = useState<(() => void) | null>(null);

  const {
    enableRealtime = true,
    enableSound = true,
    enableBrowserNotifications = true,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    ...filters
  } = options;

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', userId, filters],
    queryFn: () => userId ? getNotifications(userId, filters) : Promise.resolve([]),
    enabled: !!userId,
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: true
  });

  // Fetch unread count
  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: () => userId ? getUnreadNotificationCount(userId) : Promise.resolve(0),
    enabled: !!userId,
    refetchInterval: autoRefresh ? refreshInterval : false
  });

  // Fetch user preferences
  const {
    data: preferences,
    refetch: refetchPreferences
  } = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => userId ? getNotificationPreferences(userId) : Promise.resolve(null),
    enabled: !!userId
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: ({ notificationId }: { notificationId: string }) =>
      updateNotification(notificationId, userId!, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markNotificationsAsRead(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: ({ notificationId }: { notificationId: string }) =>
      deleteNotification(notificationId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
    }
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences: Partial<NotificationPreferences>) =>
      updateNotificationPreferences(userId!, newPreferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
    }
  });

  // Handle new notification from real-time subscription
  const handleNewNotification = useCallback((notification: BookConnectNotification) => {
    // Update cache
    queryClient.setQueryData(['notifications', userId], (oldData: BookConnectNotification[] = []) => {
      // Avoid duplicates
      if (oldData.some(n => n.id === notification.id)) {
        return oldData;
      }
      return [notification, ...oldData];
    });

    // Update unread count
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });

    // Play sound if enabled and user preferences allow
    if (enableSound && preferences?.sound_enabled !== false) {
      playNotificationSound(notification.priority);
    }

    // Show browser notification if enabled and user preferences allow
    if (enableBrowserNotifications && preferences?.push_notifications !== false) {
      showBrowserNotification(notification, {
        onClick: () => {
          // Handle notification click - could navigate to relevant page
          markAsReadMutation.mutate({ notificationId: notification.id });
        }
      });
    }
  }, [
    queryClient,
    userId,
    enableSound,
    enableBrowserNotifications,
    preferences,
    markAsReadMutation
  ]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId || !enableRealtime) {
      return;
    }

    const unsubscribe = subscribeToUserNotifications(
      userId,
      handleNewNotification,
      (error) => {
        console.error('Notification subscription error:', error);
      }
    );

    setRealtimeSubscription(() => unsubscribe);

    return () => {
      unsubscribe();
      setRealtimeSubscription(null);
    };
  }, [userId, enableRealtime, handleNewNotification]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeSubscription) {
        realtimeSubscription();
      }
    };
  }, [realtimeSubscription]);

  // Helper functions
  const markAsRead = useCallback((notificationId: string) => {
    markAsReadMutation.mutate({ notificationId });
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const deleteNotificationById = useCallback((notificationId: string) => {
    deleteNotificationMutation.mutate({ notificationId });
  }, [deleteNotificationMutation]);

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    updatePreferencesMutation.mutate(newPreferences);
  }, [updatePreferencesMutation]);

  return {
    // Data
    notifications,
    unreadCount,
    preferences,

    // Loading states
    isLoading,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,

    // Error states
    error,
    markAsReadError: markAsReadMutation.error,
    markAllAsReadError: markAllAsReadMutation.error,
    deleteError: deleteNotificationMutation.error,
    preferencesError: updatePreferencesMutation.error,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationById,
    updatePreferences,
    refetch,
    refetchUnreadCount,
    refetchPreferences,

    // Real-time status
    isRealtimeConnected: !!realtimeSubscription
  };
}

/**
 * Hook for notification preferences only
 */
export function useNotificationPreferences(userId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: preferences,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => userId ? getNotificationPreferences(userId) : Promise.resolve(null),
    enabled: !!userId
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences: Partial<NotificationPreferences>) =>
      updateNotificationPreferences(userId!, newPreferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
    }
  });

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    updatePreferencesMutation.mutate(newPreferences);
  }, [updatePreferencesMutation]);

  return {
    preferences,
    isLoading,
    error,
    isUpdating: updatePreferencesMutation.isPending,
    updateError: updatePreferencesMutation.error,
    updatePreferences,
    refetch
  };
}

export default useNotifications;
