/**
 * Notification system types for BookConnect
 */

export type NotificationType =
  | 'message'
  | 'club_invite'
  | 'book_recommendation'
  | 'system'
  | 'security'
  | 'event'
  | 'reminder';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationCategory = 'general' | 'messaging' | 'clubs' | 'books' | 'system';

export interface BookConnectNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  expires_at?: string;
  priority: NotificationPriority;
  category: NotificationCategory;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sound_enabled: boolean;
  messaging_notifications: boolean;
  club_notifications: boolean;
  book_notifications: boolean;
  system_notifications: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title_template: string;
  message_template: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  expires_at?: string;
}

export interface UpdateNotificationRequest {
  is_read?: boolean;
  read_at?: string;
}

export interface NotificationFilters {
  is_read?: boolean;
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_category: Record<NotificationCategory, number>;
  by_priority: Record<NotificationPriority, number>;
}

export interface NotificationSubscriptionOptions {
  onNotification: (notification: BookConnectNotification) => void;
  onError?: (error: Error) => void;
  userId: string;
}

// Template variable replacement
export interface TemplateVariables {
  [key: string]: string | number;
}

// Notification creation from template
export interface CreateNotificationFromTemplateRequest {
  template_name: string;
  user_id: string;
  variables: TemplateVariables;
  data?: Record<string, any>;
  expires_at?: string;
}

// Bulk notification operations
export interface BulkNotificationRequest {
  user_ids: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  category?: NotificationCategory;
}

// Real-time notification event
export interface NotificationEvent {
  type: 'notification_created' | 'notification_updated' | 'notification_deleted';
  notification: BookConnectNotification;
  user_id: string;
}

// Export with both names for compatibility
export type Notification = BookConnectNotification;

export default {
  BookConnectNotification,
  Notification: BookConnectNotification,
  NotificationPreferences,
  NotificationTemplate,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  NotificationFilters,
  NotificationStats,
  NotificationSubscriptionOptions,
  TemplateVariables,
  CreateNotificationFromTemplateRequest,
  BulkNotificationRequest,
  NotificationEvent
};
