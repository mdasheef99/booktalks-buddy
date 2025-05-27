/**
 * Notifications Test Page
 * For testing and demonstrating the notification system
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationBell, CompactNotificationBell } from '@/components/notifications';
import { useNotifications } from '@/components/notifications/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { createNotificationFromTemplate } from '@/lib/api/notifications/operations';
import { toast } from 'sonner';

export default function NotificationsTestPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);

  const createTestNotification = async (type: string) => {
    if (!user) {
      toast.error('Please log in to test notifications');
      return;
    }

    try {
      await createNotificationFromTemplate({
        template_name: 'new_message',
        user_id: user.id,
        variables: {
          sender_name: 'Test User',
          message_preview: 'This is a test notification message'
        },
        data: {
          conversation_id: 'test-conversation',
          message_id: 'test-message',
          sender_id: 'test-sender'
        }
      });
      toast.success('Test notification created!');
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast.error('Failed to create test notification');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Notifications Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to test the notification system.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span>Notification Bell:</span>
            <NotificationBell />
            <span>Compact Bell:</span>
            <CompactNotificationBell />
          </div>

          <div className="space-y-2">
            <p>Unread notifications: {unreadCount}</p>
            <p>Total notifications: {notifications.length}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => createTestNotification('message')}>
              Create Test Notification
            </Button>
            <Button onClick={markAllAsRead} variant="outline">
              Mark All as Read
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Recent Notifications:</h3>
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border rounded ${
                  notification.is_read ? 'bg-gray-50' : 'bg-blue-50'
                }`}
              >
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-gray-600">{notification.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </div>
                {!notification.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsRead(notification.id)}
                    className="mt-2"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
