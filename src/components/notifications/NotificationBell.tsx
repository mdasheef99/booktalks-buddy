/**
 * Notification Bell Component
 * Shows notification count badge and opens notification panel
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationPanel } from './NotificationPanel';
import { useNotifications } from './hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationBellProps {
  className?: string;
  showBadge?: boolean;
  autoMarkAsRead?: boolean;
  maxNotifications?: number;
}

export function NotificationBell({
  className = '',
  showBadge = true,
  autoMarkAsRead = true,
  maxNotifications = 10
}: NotificationBellProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch
  } = useNotifications(user?.id, {
    limit: maxNotifications,
    is_read: false // Only fetch unread notifications for the bell
  });

  // Handle new notifications animation
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotifications(true);
      const timer = setTimeout(() => setHasNewNotifications(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Auto-mark as read when panel opens
  useEffect(() => {
    if (isOpen && autoMarkAsRead && unreadCount > 0) {
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 1000); // Mark as read after 1 second of viewing
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoMarkAsRead, unreadCount, markAllAsRead]);

  if (!user) {
    return null;
  }

  const handleNotificationClick = (notificationId: string) => {
    if (autoMarkAsRead) {
      markAsRead(notificationId);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`
            relative p-2 hover:bg-gray-100 transition-all duration-200
            ${hasNewNotifications ? 'animate-pulse' : ''}
            ${className}
          `}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          {hasNewNotifications && unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-bookconnect-sage" />
          ) : (
            <Bell className="h-5 w-5 text-gray-600" />
          )}

          {/* Notification badge */}
          {showBadge && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={`
                absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center
                text-xs font-bold min-w-[20px] rounded-full
                ${hasNewNotifications ? 'animate-bounce' : ''}
              `}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}

          {/* Pulse indicator for new notifications */}
          {hasNewNotifications && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 shadow-lg border-0 bg-white rounded-xl"
        align="end"
        sideOffset={8}
      >
        <NotificationPanel
          notifications={notifications}
          isLoading={isLoading}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={markAllAsRead}
          onRefresh={refetch}
          maxHeight="400px"
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Compact notification bell for mobile/small spaces
 */
export function CompactNotificationBell({
  className = '',
  onClick
}: {
  className?: string;
  onClick?: () => void;
}) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id, { limit: 1 });

  if (!user) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`relative p-2 ${className}`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold min-w-[16px] rounded-full"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

/**
 * Notification bell with custom styling
 */
export function CustomNotificationBell({
  size = 'default',
  variant = 'default',
  className = '',
  children
}: {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  children?: React.ReactNode;
}) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id, { limit: 1 });

  if (!user) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const badgeSizes = {
    sm: 'h-3 w-3 text-xs',
    default: 'h-4 w-4 text-xs',
    lg: 'h-5 w-5 text-sm'
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      {children || (
        <Button variant={variant} size={size}>
          <Bell className={sizeClasses[size]} />
        </Button>
      )}

      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className={`
            absolute -top-1 -right-1 p-0 flex items-center justify-center
            font-bold min-w-[16px] rounded-full
            ${badgeSizes[size]}
          `}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
}

export default NotificationBell;
