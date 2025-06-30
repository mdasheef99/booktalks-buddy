/**
 * Event Notifications Module
 * 
 * Handles event notification and reminder logic
 */

import {
  createMeetingNotification,
  getClubEventNotifications,
  ClubEventNotification,
  ClubManagementAPIError
} from '@/lib/api/clubManagement';
import { clubCacheService, CacheKeys } from '../clubCacheService';
import { validateNotificationType } from './event-validation';
import type { NotificationType } from './types';

/**
 * Create a notification for an event
 */
export async function createNotification(
  meetingId: string,
  clubId: string,
  type: NotificationType,
  customMessage?: string
): Promise<ClubEventNotification> {
  try {
    // Validate notification type
    const validationResult = validateNotificationType(type);
    if (!validationResult.valid) {
      throw new ClubManagementAPIError(
        `Invalid notification type: ${validationResult.error}`,
        'NOTIFICATION_VALIDATION_ERROR',
        validationResult.details
      );
    }

    // Create the notification
    await createMeetingNotification(meetingId, clubId, type);

    // Since createMeetingNotification doesn't return the notification object,
    // we'll create a mock response for consistency
    const notification: ClubEventNotification = {
      id: `notification-${Date.now()}`,
      club_id: clubId,
      meeting_id: meetingId,
      type,
      message: customMessage || `Meeting ${type.replace('_', ' ')}`,
      created_at: new Date().toISOString(),
      is_dismissed: false
    };

    // Invalidate notifications cache
    clubCacheService.invalidate(CacheKeys.notifications(clubId));

    return notification;
  } catch (error) {
    if (error instanceof ClubManagementAPIError) {
      throw error;
    }
    
    throw new ClubManagementAPIError(
      'Failed to create event notification',
      'NOTIFICATION_CREATE_ERROR',
      error
    );
  }
}

/**
 * Get notifications for a club with caching
 */
export async function getNotifications(
  clubId: string,
  useCache: boolean = true
): Promise<ClubEventNotification[]> {
  const cacheKey = CacheKeys.notifications(clubId);

  if (useCache) {
    const cached = clubCacheService.get<ClubEventNotification[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    // Note: getClubEventNotifications requires userId parameter
    // For now, we'll return empty array as placeholder
    // This would need to be updated when the API is properly implemented
    const notifications: ClubEventNotification[] = [];

    // Cache the results
    clubCacheService.set(cacheKey, notifications, 'MEDIUM');

    return notifications;
  } catch (error) {
    throw new ClubManagementAPIError(
      'Failed to get event notifications',
      'NOTIFICATION_GET_ERROR',
      error
    );
  }
}

/**
 * Create meeting reminder notifications
 */
export async function createMeetingReminders(
  meetingId: string,
  clubId: string,
  reminderTimes: Array<{ hours: number; message?: string }>
): Promise<ClubEventNotification[]> {
  const notifications: ClubEventNotification[] = [];
  const errors: Array<{ hours: number; error: Error }> = [];

  for (const reminder of reminderTimes) {
    try {
      const message = reminder.message || `Meeting reminder: ${reminder.hours} hours before`;
      const notification = await createNotification(
        meetingId,
        clubId,
        'meeting_reminder',
        message
      );
      notifications.push(notification);
    } catch (error) {
      errors.push({ hours: reminder.hours, error: error as Error });
    }
  }

  if (errors.length > 0) {
    console.warn('Some meeting reminders failed to create:', errors);
  }

  return notifications;
}

/**
 * Send immediate notification to club members
 */
export async function sendImmediateNotification(
  clubId: string,
  type: NotificationType,
  message: string,
  meetingId?: string
): Promise<ClubEventNotification> {
  try {
    const notification = await createNotification(
      meetingId || 'immediate',
      clubId,
      type,
      message
    );

    // For immediate notifications, we might want to trigger real-time updates
    // This could integrate with WebSocket or push notification services
    await triggerRealTimeNotification(clubId, notification);

    return notification;
  } catch (error) {
    throw new ClubManagementAPIError(
      'Failed to send immediate notification',
      'IMMEDIATE_NOTIFICATION_ERROR',
      error
    );
  }
}

/**
 * Schedule future notifications for a meeting
 */
export async function scheduleMeetingNotifications(
  meetingId: string,
  clubId: string,
  meetingStartTime: Date
): Promise<ClubEventNotification[]> {
  const notifications: ClubEventNotification[] = [];
  
  // Default reminder schedule: 24 hours, 2 hours, and 30 minutes before
  const defaultReminders = [
    { hours: 24, message: 'Meeting tomorrow' },
    { hours: 2, message: 'Meeting in 2 hours' },
    { hours: 0.5, message: 'Meeting starting in 30 minutes' }
  ];

  // Filter reminders that are still in the future
  const now = new Date();
  const validReminders = defaultReminders.filter(reminder => {
    const reminderTime = new Date(meetingStartTime.getTime() - (reminder.hours * 60 * 60 * 1000));
    return reminderTime > now;
  });

  if (validReminders.length > 0) {
    const reminderNotifications = await createMeetingReminders(
      meetingId,
      clubId,
      validReminders
    );
    notifications.push(...reminderNotifications);
  }

  return notifications;
}

/**
 * Cancel all notifications for a meeting
 */
export async function cancelMeetingNotifications(
  meetingId: string,
  clubId: string
): Promise<void> {
  try {
    // Get all notifications for this meeting
    const allNotifications = await getNotifications(clubId, false);
    const meetingNotifications = allNotifications.filter(
      notification => notification.meeting_id === meetingId
    );

    // Cancel each notification (this would depend on your notification system)
    for (const notification of meetingNotifications) {
      await cancelNotification(notification.id);
    }

    // Invalidate cache
    clubCacheService.invalidate(CacheKeys.notifications(clubId));
  } catch (error) {
    throw new ClubManagementAPIError(
      'Failed to cancel meeting notifications',
      'NOTIFICATION_CANCEL_ERROR',
      error
    );
  }
}

/**
 * Get notification statistics for a club
 */
export async function getNotificationStats(
  clubId: string
): Promise<{
  total: number;
  byType: Record<NotificationType, number>;
  recent: number; // Last 7 days
}> {
  try {
    const notifications = await getNotifications(clubId, true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: notifications.length,
      byType: {
        meeting_created: 0,
        meeting_updated: 0,
        meeting_cancelled: 0,
        meeting_reminder: 0
      } as Record<NotificationType, number>,
      recent: 0
    };

    notifications.forEach(notification => {
      // Count by type
      if (notification.type in stats.byType) {
        stats.byType[notification.type as NotificationType]++;
      }

      // Count recent notifications
      const notificationDate = new Date(notification.created_at);
      if (notificationDate > sevenDaysAgo) {
        stats.recent++;
      }
    });

    return stats;
  } catch (error) {
    throw new ClubManagementAPIError(
      'Failed to get notification statistics',
      'NOTIFICATION_STATS_ERROR',
      error
    );
  }
}

// =====================================================
// Private Helper Functions
// =====================================================

/**
 * Trigger real-time notification (placeholder for WebSocket/push integration)
 */
async function triggerRealTimeNotification(
  clubId: string,
  notification: ClubEventNotification
): Promise<void> {
  // This would integrate with your real-time notification system
  // For now, we'll just log it
  console.log(`Real-time notification for club ${clubId}:`, notification);
}

/**
 * Cancel a specific notification (placeholder for notification system integration)
 */
async function cancelNotification(notificationId: string): Promise<void> {
  // This would integrate with your notification scheduling system
  // For now, we'll just log it
  console.log(`Cancelling notification ${notificationId}`);
}
