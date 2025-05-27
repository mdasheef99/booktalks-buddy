/**
 * Notification system API exports for BookConnect
 */

// Types
export * from './types';

// Operations
export * from './operations';

// Real-time
export * from './realtime';

// Re-export commonly used functions with shorter names
export {
  getNotifications as fetchNotifications,
  getUnreadNotificationCount as fetchUnreadCount,
  createNotification as sendNotification,
  markNotificationsAsRead as markAsRead,
  updateNotificationPreferences as updatePreferences,
  getNotificationPreferences as fetchPreferences
} from './operations';

export {
  subscribeToUserNotifications as subscribe,
  notificationRealtimeManager as realtimeManager
} from './realtime';
