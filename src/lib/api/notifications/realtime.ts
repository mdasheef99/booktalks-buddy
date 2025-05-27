/**
 * Real-time notification system for BookConnect
 */

import { supabase } from '@/lib/supabase';
import { BookConnectNotification, NotificationSubscriptionOptions, NotificationEvent } from './types';
import { RealtimeChannel } from '@supabase/supabase-js';

class NotificationRealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, NotificationSubscriptionOptions> = new Map();

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(options: NotificationSubscriptionOptions): () => void {
    const { userId, onNotification, onError } = options;
    const channelName = `notifications:${userId}`;

    // Remove existing subscription if any
    this.unsubscribeFromNotifications(userId);

    try {
      // Create new channel
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const notification = payload.new as BookConnectNotification;
            onNotification(notification);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const notification = payload.new as BookConnectNotification;
            onNotification(notification);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to notifications for user ${userId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Failed to subscribe to notifications for user ${userId}`);
            onError?.(new Error('Failed to subscribe to notifications'));
          }
        });

      // Store channel and subscription
      this.channels.set(userId, channel);
      this.subscriptions.set(userId, options);

      // Return unsubscribe function
      return () => this.unsubscribeFromNotifications(userId);
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      onError?.(error as Error);
      return () => {};
    }
  }

  /**
   * Unsubscribe from notifications for a user
   */
  unsubscribeFromNotifications(userId: string): void {
    const channel = this.channels.get(userId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(userId);
      this.subscriptions.delete(userId);
      console.log(`Unsubscribed from notifications for user ${userId}`);
    }
  }

  /**
   * Unsubscribe from all notifications
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, userId) => {
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from notifications for user ${userId}`);
    });
    this.channels.clear();
    this.subscriptions.clear();
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if user has active subscription
   */
  hasActiveSubscription(userId: string): boolean {
    return this.channels.has(userId);
  }
}

// Singleton instance
export const notificationRealtimeManager = new NotificationRealtimeManager();

/**
 * Hook-like function for subscribing to notifications
 */
export function subscribeToUserNotifications(
  userId: string,
  onNotification: (notification: BookConnectNotification) => void,
  onError?: (error: Error) => void
): () => void {
  return notificationRealtimeManager.subscribeToNotifications({
    userId,
    onNotification,
    onError
  });
}

/**
 * Utility function to create notification sound
 */
export function playNotificationSound(priority: string = 'normal'): void {
  try {
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Different frequencies for different priorities
    const frequencies = {
      low: 400,
      normal: 600,
      high: 800,
      urgent: 1000
    };

    const frequency = frequencies[priority as keyof typeof frequencies] || frequencies.normal;

    // Create oscillator for beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    // Set volume based on priority
    const volumes = {
      low: 0.1,
      normal: 0.2,
      high: 0.3,
      urgent: 0.4
    };

    gainNode.gain.setValueAtTime(volumes[priority as keyof typeof volumes] || volumes.normal, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
}

/**
 * Utility function to show browser notification
 */
export async function showBrowserNotification(
  notification: BookConnectNotification,
  options: {
    icon?: string;
    badge?: string;
    onClick?: () => void;
  } = {}
): Promise<void> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return;
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: notification.id, // Prevent duplicate notifications
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low'
      });

      // Handle click
      if (options.onClick) {
        browserNotification.onclick = () => {
          options.onClick!();
          browserNotification.close();
        };
      }

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  } catch (error) {
    console.warn('Could not show browser notification:', error);
  }
}

/**
 * Utility function to check if user is in quiet hours
 */
export function isInQuietHours(
  quietHoursStart?: string,
  quietHoursEnd?: string,
  timezone: string = 'UTC'
): boolean {
  if (!quietHoursStart || !quietHoursEnd) {
    return false;
  }

  try {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: timezone
    });

    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = quietHoursStart.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = quietHoursEnd.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 06:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  } catch (error) {
    console.warn('Error checking quiet hours:', error);
    return false;
  }
}

export default {
  notificationRealtimeManager,
  subscribeToUserNotifications,
  playNotificationSound,
  showBrowserNotification,
  isInQuietHours
};
