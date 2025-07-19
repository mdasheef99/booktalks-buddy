/**
 * Alert Toast Component
 * 
 * Toast notification component for temporary alerts in BookTalks Buddy.
 * Integrates with sonner toast system for contextual notifications.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Implementation - Phase 1
 */

import React from 'react';
import { toast } from 'sonner';
import { AlertTriangle, XCircle, Shield, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertType, AlertPriority } from '@/lib/alerts/types';

// =========================
// Icon Mapping
// =========================

const TOAST_ICONS = {
  AlertTriangle,
  XCircle,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Info
};

// =========================
// Toast Configuration
// =========================

const TOAST_CONFIG: Record<AlertType, {
  icon: keyof typeof TOAST_ICONS;
  duration: number;
  className: string;
}> = {
  // User subscription alerts
  'subscription_expiry_warning': {
    icon: 'AlertTriangle',
    duration: 8000,
    className: 'border-orange-200 bg-orange-50'
  },
  'subscription_expired': {
    icon: 'XCircle',
    duration: 10000,
    className: 'border-red-200 bg-red-50'
  },
  'role_access_denied': {
    icon: 'Shield',
    duration: 6000,
    className: 'border-red-200 bg-red-50'
  },
  'grace_period_warning': {
    icon: 'Clock',
    duration: 8000,
    className: 'border-amber-200 bg-amber-50'
  },
  
  // Admin security alerts
  'role_bypass_detected': {
    icon: 'AlertTriangle',
    duration: 0, // Persistent
    className: 'border-red-300 bg-red-100'
  },
  'subscription_enforcement_violation': {
    icon: 'Shield',
    duration: 12000,
    className: 'border-orange-300 bg-orange-100'
  },
  'system_health_warning': {
    icon: 'AlertCircle',
    duration: 10000,
    className: 'border-yellow-300 bg-yellow-100'
  },
  
  // Store owner alerts
  'expired_users_with_roles': {
    icon: 'AlertTriangle',
    duration: 15000,
    className: 'border-red-300 bg-red-100'
  },
  'subscription_system_health': {
    icon: 'Info',
    duration: 10000,
    className: 'border-blue-300 bg-blue-100'
  }
};

// =========================
// Toast Alert Functions
// =========================

/**
 * Show alert as toast notification
 */
export function showAlertToast(alert: Alert, options?: {
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}) {
  const config = TOAST_CONFIG[alert.type];
  const IconComponent = TOAST_ICONS[config.icon];

  // Determine toast type based on priority
  const getToastType = (priority: AlertPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'info';
    }
  };

  const toastType = getToastType(alert.priority);

  // Create toast content
  const toastContent = (
    <div className="flex items-start gap-3 p-2">
      <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm mb-1">
          {alert.title}
        </div>
        <div className="text-sm text-gray-600 leading-relaxed">
          {alert.message}
        </div>
        
        {/* Subscription data for subscription alerts */}
        {'subscriptionData' in alert && alert.subscriptionData && (
          <div className="mt-2 text-xs text-gray-500">
            {alert.subscriptionData.daysRemaining !== undefined && (
              <span>Days remaining: {alert.subscriptionData.daysRemaining}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Toast options
  const toastOptions: any = {
    duration: config.duration,
    className: config.className,
    onDismiss: options?.onDismiss,
  };

  // Add action if provided
  if (options?.onAction && options?.actionLabel) {
    toastOptions.action = {
      label: options.actionLabel,
      onClick: options.onAction
    };
  }

  // Show appropriate toast type
  switch (toastType) {
    case 'error':
      return toast.error(toastContent, toastOptions);
    case 'warning':
      return toast.warning(toastContent, toastOptions);
    case 'success':
      return toast.success(toastContent, toastOptions);
    case 'info':
    default:
      return toast.info(toastContent, toastOptions);
  }
}

// =========================
// Specialized Toast Functions
// =========================

/**
 * Show subscription expired toast
 */
export function showSubscriptionExpiredToast(
  currentTier: string,
  onContactStore?: () => void
) {
  return toast.error(
    <div className="flex items-start gap-3">
      <XCircle className="h-5 w-5 mt-0.5 text-red-500" />
      <div>
        <div className="font-medium text-sm mb-1">
          Subscription Expired
        </div>
        <div className="text-sm text-gray-600">
          Your {currentTier} subscription has expired. Some features may be limited.
        </div>
      </div>
    </div>,
    {
      duration: 10000,
      action: onContactStore ? {
        label: 'Contact Store',
        onClick: onContactStore
      } : undefined,
      className: 'border-red-200 bg-red-50'
    }
  );
}

/**
 * Show subscription expiry warning toast
 */
export function showSubscriptionExpiryWarningToast(
  daysRemaining: number,
  onContactStore?: () => void
) {
  return toast.warning(
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 mt-0.5 text-orange-500" />
      <div>
        <div className="font-medium text-sm mb-1">
          Subscription Expiring Soon
        </div>
        <div className="text-sm text-gray-600">
          Your subscription expires in {daysRemaining} days. Contact your store to renew.
        </div>
      </div>
    </div>,
    {
      duration: 8000,
      action: onContactStore ? {
        label: 'Contact Store',
        onClick: onContactStore
      } : undefined,
      className: 'border-orange-200 bg-orange-50'
    }
  );
}

/**
 * Show role access denied toast
 */
export function showRoleAccessDeniedToast(
  featureName: string,
  requiredTier: string,
  onContactStore?: () => void
) {
  return toast.error(
    <div className="flex items-start gap-3">
      <Shield className="h-5 w-5 mt-0.5 text-red-500" />
      <div>
        <div className="font-medium text-sm mb-1">
          Access Denied
        </div>
        <div className="text-sm text-gray-600">
          {featureName} requires an active {requiredTier} subscription.
        </div>
      </div>
    </div>,
    {
      duration: 6000,
      action: onContactStore ? {
        label: 'Contact Store',
        onClick: onContactStore
      } : undefined,
      className: 'border-red-200 bg-red-50'
    }
  );
}

/**
 * Show grace period warning toast
 */
export function showGracePeriodWarningToast(
  roleName: string,
  daysRemaining: number,
  onContactStore?: () => void
) {
  return toast.warning(
    <div className="flex items-start gap-3">
      <Clock className="h-5 w-5 mt-0.5 text-amber-500" />
      <div>
        <div className="font-medium text-sm mb-1">
          Role Access Ending Soon
        </div>
        <div className="text-sm text-gray-600">
          Your {roleName} access expires in {daysRemaining} days.
        </div>
      </div>
    </div>,
    {
      duration: 8000,
      action: onContactStore ? {
        label: 'Renew Subscription',
        onClick: onContactStore
      } : undefined,
      className: 'border-amber-200 bg-amber-50'
    }
  );
}

/**
 * Show success toast for resolved alerts
 */
export function showAlertResolvedToast(alertTitle: string) {
  return toast.success(
    <div className="flex items-start gap-3">
      <CheckCircle className="h-5 w-5 mt-0.5 text-green-500" />
      <div>
        <div className="font-medium text-sm mb-1">
          Alert Resolved
        </div>
        <div className="text-sm text-gray-600">
          {alertTitle} has been resolved successfully.
        </div>
      </div>
    </div>,
    {
      duration: 4000,
      className: 'border-green-200 bg-green-50'
    }
  );
}

// =========================
// Alert Toast Hook
// =========================

/**
 * Hook for showing alert toasts
 */
export function useAlertToasts() {
  return {
    showAlertToast,
    showSubscriptionExpiredToast,
    showSubscriptionExpiryWarningToast,
    showRoleAccessDeniedToast,
    showGracePeriodWarningToast,
    showAlertResolvedToast
  };
}
