/**
 * Notification system operations for BookConnect
 */

import { supabase } from '@/lib/supabase';
import {
  BookConnectNotification,
  NotificationPreferences,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  NotificationFilters,
  NotificationStats,
  CreateNotificationFromTemplateRequest,
  BulkNotificationRequest,
  TemplateVariables
} from './types';

// Error handling
class NotificationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

/**
 * Get notifications for a user with optional filtering
 */
export async function getNotifications(
  userId: string,
  filters: NotificationFilters = {}
): Promise<BookConnectNotification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // Filter out expired notifications
    query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    const { data, error } = await query;

    if (error) {
      throw new NotificationError(`Failed to fetch notifications: ${error.message}`, error.code);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to fetch notifications');
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', { user_uuid: userId });

    if (error) {
      throw new NotificationError(`Failed to get unread count: ${error.message}`, error.code);
    }

    return data || 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to get unread count');
  }
}

/**
 * Create a new notification
 */
export async function createNotification(
  notification: CreateNotificationRequest
): Promise<BookConnectNotification> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        priority: notification.priority || 'normal',
        category: notification.category || 'general',
        expires_at: notification.expires_at
      })
      .select()
      .single();

    if (error) {
      throw new NotificationError(`Failed to create notification: ${error.message}`, error.code);
    }

    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to create notification');
  }
}

/**
 * Update a notification (typically to mark as read)
 */
export async function updateNotification(
  notificationId: string,
  userId: string,
  updates: UpdateNotificationRequest
): Promise<BookConnectNotification> {
  try {
    const updateData: any = { ...updates };

    // If marking as read, set read_at timestamp
    if (updates.is_read === true && !updates.read_at) {
      updateData.read_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new NotificationError(`Failed to update notification: ${error.message}`, error.code);
    }

    return data;
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to update notification');
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds?: string[]
): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('mark_notifications_as_read', {
        user_uuid: userId,
        notification_ids: notificationIds || null
      });

    if (error) {
      throw new NotificationError(`Failed to mark notifications as read: ${error.message}`, error.code);
    }

    return data || 0;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to mark notifications as read');
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new NotificationError(`Failed to delete notification: ${error.message}`, error.code);
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to delete notification');
  }
}

/**
 * Get notification statistics for a user
 */
export async function getNotificationStats(userId: string): Promise<NotificationStats> {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('category, priority, is_read')
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    if (error) {
      throw new NotificationError(`Failed to get notification stats: ${error.message}`, error.code);
    }

    const stats: NotificationStats = {
      total: notifications?.length || 0,
      unread: notifications?.filter(n => !n.is_read).length || 0,
      by_category: {
        general: 0,
        messaging: 0,
        clubs: 0,
        books: 0,
        system: 0
      },
      by_priority: {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0
      }
    };

    notifications?.forEach(notification => {
      stats.by_category[notification.category as keyof typeof stats.by_category]++;
      stats.by_priority[notification.priority as keyof typeof stats.by_priority]++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to get notification stats');
  }
}

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new NotificationError(`Failed to get notification preferences: ${error.message}`, error.code);
    }

    return data;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to get notification preferences');
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new NotificationError(`Failed to update notification preferences: ${error.message}`, error.code);
    }

    return data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to update notification preferences');
  }
}

/**
 * Create notification from template
 */
export async function createNotificationFromTemplate(
  request: CreateNotificationFromTemplateRequest
): Promise<BookConnectNotification> {
  try {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('name', request.template_name)
      .eq('is_active', true)
      .single();

    if (templateError) {
      throw new NotificationError(`Template not found: ${templateError.message}`, templateError.code);
    }

    // Replace variables in template
    let title = template.title_template;
    let message = template.message_template;

    Object.entries(request.variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Create notification
    return await createNotification({
      user_id: request.user_id,
      type: template.type,
      title,
      message,
      data: request.data,
      priority: template.priority,
      category: template.category,
      expires_at: request.expires_at
    });
  } catch (error) {
    console.error('Error creating notification from template:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to create notification from template');
  }
}

/**
 * Create bulk notifications
 */
export async function createBulkNotifications(
  request: BulkNotificationRequest
): Promise<BookConnectNotification[]> {
  try {
    const notifications = request.user_ids.map(userId => ({
      user_id: userId,
      type: request.type,
      title: request.title,
      message: request.message,
      data: request.data || {},
      priority: request.priority || 'normal',
      category: request.category || 'general'
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      throw new NotificationError(`Failed to create bulk notifications: ${error.message}`, error.code);
    }

    return data || [];
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error instanceof NotificationError ? error : new NotificationError('Failed to create bulk notifications');
  }
}
