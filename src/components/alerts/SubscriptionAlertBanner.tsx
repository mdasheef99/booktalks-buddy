/**
 * Subscription Alert Banner Component
 * 
 * Specialized alert banner component for subscription-related alerts in BookTalks Buddy.
 * Displays subscription expiry warnings, expired notifications, and role access information.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Implementation - Phase 1
 */

import React from 'react';
import { X, AlertTriangle, XCircle, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserSubscriptionAlert } from '@/lib/alerts/types';

// =========================
// Component Props
// =========================

interface SubscriptionAlertBannerProps {
  /** Subscription alert data */
  alert: UserSubscriptionAlert;
  
  /** Dismiss handler */
  onDismiss?: (alertId: string) => void;
  
  /** Contact store handler */
  onContactStore?: () => void;
  
  /** Additional CSS classes */
  className?: string;
}

// =========================
// Alert Configuration
// =========================

const SUBSCRIPTION_ALERT_CONFIG = {
  subscription_expired: {
    icon: XCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-500',
    dismissible: false,
    priority: 'HIGH' as const
  },
  subscription_expiry_warning: {
    icon: AlertTriangle,
    className: 'bg-orange-50 border-orange-200 text-orange-800',
    iconColor: 'text-orange-500',
    dismissible: true,
    priority: 'MEDIUM' as const
  },
  role_access_denied: {
    icon: Shield,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-500',
    dismissible: true,
    priority: 'HIGH' as const
  },
  grace_period_warning: {
    icon: Clock,
    className: 'bg-amber-50 border-amber-200 text-amber-800',
    iconColor: 'text-amber-500',
    dismissible: true,
    priority: 'MEDIUM' as const
  }
};

// =========================
// Main Component
// =========================

export function SubscriptionAlertBanner({
  alert,
  onDismiss,
  onContactStore,
  className = ''
}: SubscriptionAlertBannerProps) {
  const config = SUBSCRIPTION_ALERT_CONFIG[alert.type];
  const IconComponent = config.icon;

  // =========================
  // Event Handlers
  // =========================

  const handleDismiss = () => {
    if (onDismiss && config.dismissible) {
      onDismiss(alert.id);
    }
  };

  const handleContactStore = () => {
    if (onContactStore) {
      onContactStore();
    }
  };

  // =========================
  // Render Helpers
  // =========================

  const renderSubscriptionDetails = () => {
    if (!alert.subscriptionData) return null;

    const { currentTier, expiryDate, daysRemaining, hasActiveSubscription } = alert.subscriptionData;

    return (
      <div className="mt-3 text-xs opacity-75 space-y-1">
        <div className="flex items-center gap-4">
          <span>Current Tier: <span className="font-medium">{currentTier}</span></span>
          {daysRemaining !== undefined && (
            <span>
              {daysRemaining < 0 ? 'Days Since Expiry:' : 'Days Remaining:'} <span className={`font-medium ${Math.abs(daysRemaining) <= 0 ? 'text-red-600' : Math.abs(daysRemaining) <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                {Math.abs(daysRemaining)}
              </span>
            </span>
          )}
          <span>Status: <span className={`font-medium ${hasActiveSubscription ? 'text-green-600' : 'text-red-600'}`}>
            {hasActiveSubscription ? 'Active' : 'Inactive'}
          </span></span>
        </div>
        {expiryDate && (
          <div>
            Expiry Date: <span className="font-medium">
              {new Date(expiryDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderActions = () => {
    const actions = [];

    // Contact store action for subscription issues
    if (onContactStore) {
      actions.push(
        <Button
          key="contact"
          size="sm"
          onClick={handleContactStore}
          className="h-7 px-3 text-xs bg-bookconnect-brown hover:bg-bookconnect-brown/90 text-white"
        >
          Contact Store Owner
        </Button>
      );
    }

    if (actions.length === 0) return null;

    return (
      <div className="flex gap-2 mt-3">
        {actions}
      </div>
    );
  };

  // =========================
  // Alert Type Specific Content
  // =========================

  const getAlertSpecificContent = () => {
    switch (alert.type) {
      case 'subscription_expired':
        return (
          <div className="text-sm">
            <p className="font-medium mb-1">Your subscription has expired</p>
            <p>Some premium features may be limited until you renew your subscription. Contact your store owner to restore full access.</p>
          </div>
        );

      case 'subscription_expiry_warning':
        const daysRemaining = alert.subscriptionData?.daysRemaining || 0;
        return (
          <div className="text-sm">
            <p className="font-medium mb-1">Subscription expiring soon</p>
            <p>Your subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. Contact your store owner to renew and avoid service interruption.</p>
          </div>
        );

      case 'role_access_denied':
        return (
          <div className="text-sm">
            <p className="font-medium mb-1">Premium feature access denied</p>
            <p>This feature requires an active subscription. Contact your store owner to upgrade your membership.</p>
          </div>
        );

      case 'grace_period_warning':
        const graceDays = alert.subscriptionData?.daysRemaining || 0;
        return (
          <div className="text-sm">
            <p className="font-medium mb-1">Role access ending soon</p>
            <p>Your premium role access expires in {graceDays} day{graceDays !== 1 ? 's' : ''}. Renew your subscription to maintain access.</p>
          </div>
        );

      default:
        return (
          <div className="text-sm">
            <p className="font-medium mb-1">{alert.title}</p>
            <p>{alert.message}</p>
          </div>
        );
    }
  };

  // =========================
  // Render Component
  // =========================

  return (
    <div className={`
      rounded-lg border p-4 relative
      ${config.className}
      ${className}
    `}>
      {/* Dismiss Button */}
      {config.dismissible && onDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Alert Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-8">
          {getAlertSpecificContent()}
          {renderSubscriptionDetails()}
          {renderActions()}
        </div>
      </div>

      {/* Priority Indicator */}
      <div className={`
        absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
        ${config.priority === 'HIGH' ? 'bg-red-500' : ''}
        ${config.priority === 'MEDIUM' ? 'bg-orange-500' : ''}
      `} />
    </div>
  );
}

// =========================
// Export Default
// =========================

export default SubscriptionAlertBanner;
