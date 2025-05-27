/**
 * Notification Panel Component
 * Displays list of notifications in a dropdown panel
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageCircle,
  Users,
  Book,
  Settings,
  CheckCheck,
  Trash2,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookConnectNotification, NotificationType } from '@/lib/api/notifications/types';
import { useNavigate } from 'react-router-dom';

interface NotificationPanelProps {
  notifications: BookConnectNotification[];
  isLoading: boolean;
  onNotificationClick: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
  maxHeight?: string;
}

export function NotificationPanel({
  notifications,
  isLoading,
  onNotificationClick,
  onMarkAllAsRead,
  onRefresh,
  maxHeight = "400px"
}: NotificationPanelProps) {
  const navigate = useNavigate();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'club_invite':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'book_recommendation':
        return <Book className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: BookConnectNotification) => {
    onNotificationClick(notification.id);

    // Navigate based on notification type
    if (notification.type === 'message' && notification.data?.conversation_id) {
      navigate(`/messages/${notification.data.conversation_id}`);
    } else if (notification.type === 'club_invite' && notification.data?.club_id) {
      navigate(`/clubs/${notification.data.club_id}`);
    } else if (notification.type === 'book_recommendation' && notification.data?.book_id) {
      navigate(`/books/${notification.data.book_id}`);
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <Button variant="ghost" size="sm" disabled>
            <RefreshCw className="h-4 w-4 animate-spin" />
          </Button>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-100">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0"
            aria-label="Refresh notifications"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-8 w-8 p-0"
              aria-label="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea style={{ maxHeight }}>
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="p-2">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <div
                  className={`
                    p-3 rounded-lg cursor-pointer transition-all duration-200
                    hover:bg-gray-50 border-l-4 mb-2
                    ${getPriorityColor(notification.priority)}
                    ${!notification.is_read ? 'bg-opacity-100' : 'bg-opacity-50'}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`
                            text-sm leading-tight
                            ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}
                          `}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {index < notifications.length - 1 && (
                  <Separator className="my-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm text-gray-600 hover:text-gray-900"
            onClick={() => navigate('/notifications')}
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
