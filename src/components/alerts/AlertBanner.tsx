/**
 * Alert Banner Component
 * 
 * Reusable alert banner component for displaying persistent alerts in BookTalks Buddy.
 * Supports different alert types, priorities, and user interactions.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Implementation - Phase 1
 */

import React from 'react';
import { X, AlertTriangle, XCircle, Shield, Clock, AlertCircle, Users, Activity } from 'lucide-react';
import { Alert, AlertDisplayConfig, ALERT_DISPLAY_CONFIG } from '@/lib/alerts/types';
import { Button } from '@/components/ui/button';

// =========================
// Icon Mapping
// =========================

const ALERT_ICONS = {
  AlertTriangle,
  XCircle,
  Shield,
  Clock,
  AlertCircle,
  Users,
  Activity
};

// =========================
// Component Props
// =========================

interface AlertBannerProps {
  /** Alert data */
  alert: Alert;
  
  /** Dismiss handler */
  onDismiss?: (alertId: string) => void;
  
  /** Resolve handler */
  onResolve?: (alertId: string) => void;
  
  /** Custom actions */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'destructive';
  }>;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Show timestamp */
  showTimestamp?: boolean;
}

// =========================
// Alert Banner Component
// =========================

export function AlertBanner({
  alert,
  onDismiss,
  onResolve,
  actions = [],
  className = '',
  showTimestamp = false
}: AlertBannerProps) {
  const config: AlertDisplayConfig = ALERT_DISPLAY_CONFIG[alert.type];
  const IconComponent = ALERT_ICONS[config.icon as keyof typeof ALERT_ICONS] || AlertTriangle;

  // =========================
  // Event Handlers
  // =========================

  const handleDismiss = () => {
    if (onDismiss && config.dismissible) {
      onDismiss(alert.id);
    }
  };

  const handleResolve = () => {
    if (onResolve) {
      onResolve(alert.id);
    }
  };

  // =========================
  // Render Helpers
  // =========================

  const renderTimestamp = () => {
    if (!showTimestamp) return null;
    
    const createdAt = new Date(alert.createdAt);
    const timeString = createdAt.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return (
      <span className="text-xs opacity-75 ml-2">
        {timeString}
      </span>
    );
  };

  const renderActions = () => {
    const allActions = [
      ...actions,
      ...(onResolve ? [{
        label: 'Resolve',
        onClick: handleResolve,
        variant: 'secondary' as const
      }] : [])
    ];

    if (allActions.length === 0) return null;

    return (
      <div className="flex gap-2 mt-2">
        {allActions.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant={action.variant || 'default'}
            onClick={action.onClick}
            className="h-7 px-3 text-xs"
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  // =========================
  // Render Component
  // =========================

  return (
    <div className={`
      rounded-lg border p-4 mb-4 relative
      ${config.className}
      ${className}
    `}>
      {/* Dismiss Button */}
      {config.dismissible && onDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Alert Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Timestamp */}
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">
              {alert.title}
            </h4>
            {renderTimestamp()}
          </div>

          {/* Message */}
          <p className="text-sm mt-1 leading-relaxed">
            {alert.message}
          </p>

          {/* Subscription Data (for subscription alerts) */}
          {'subscriptionData' in alert && alert.subscriptionData && (
            <div className="mt-2 text-xs opacity-75">
              <div className="flex items-center gap-4">
                <span>Tier: {alert.subscriptionData.currentTier}</span>
                {alert.subscriptionData.daysRemaining !== undefined && (
                  <span>Days remaining: {alert.subscriptionData.daysRemaining}</span>
                )}
                {alert.subscriptionData.expiryDate && (
                  <span>
                    Expires: {new Date(alert.subscriptionData.expiryDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Security Data (for security alerts) */}
          {'securityData' in alert && alert.securityData && (
            <div className="mt-2 text-xs opacity-75">
              <div className="flex items-center gap-4">
                <span>Severity: {alert.securityData.severity}</span>
                {alert.securityData.affectedUserId && (
                  <span>User: {alert.securityData.affectedUserId}</span>
                )}
                <span>
                  Detected: {new Date(alert.securityData.detectionTime).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Store Data (for store owner alerts) */}
          {'storeData' in alert && alert.storeData && (
            <div className="mt-2 text-xs opacity-75">
              <div className="flex items-center gap-4">
                {alert.storeData.affectedUserCount && (
                  <span>Affected users: {alert.storeData.affectedUserCount}</span>
                )}
                {alert.storeData.healthScore && (
                  <span>Health score: {alert.storeData.healthScore}%</span>
                )}
                {alert.storeData.actionRequired && (
                  <span className="font-medium">Action required</span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {renderActions()}
        </div>
      </div>

      {/* Priority Indicator */}
      <div className={`
        absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
        ${alert.priority === 'CRITICAL' ? 'bg-red-500' : ''}
        ${alert.priority === 'HIGH' ? 'bg-orange-500' : ''}
        ${alert.priority === 'MEDIUM' ? 'bg-yellow-500' : ''}
        ${alert.priority === 'LOW' ? 'bg-blue-500' : ''}
      `} />
    </div>
  );
}

// =========================
// Specialized Banner Components
// =========================

/**
 * Subscription Alert Banner - specialized for subscription alerts
 */
interface SubscriptionAlertBannerProps {
  alert: Alert & { category: 'USER_SUBSCRIPTION' };
  onDismiss?: (alertId: string) => void;
  onContactStore?: () => void;
  className?: string;
}

export function SubscriptionAlertBanner({
  alert,
  onDismiss,
  onContactStore,
  className
}: SubscriptionAlertBannerProps) {
  const actions = [];

  // Add contact store action for subscription-related alerts
  if (onContactStore) {
    actions.push({
      label: 'Contact Store',
      onClick: onContactStore,
      variant: 'default' as const
    });
  }

  return (
    <AlertBanner
      alert={alert}
      onDismiss={onDismiss}
      actions={actions}
      className={className}
      showTimestamp={false}
    />
  );
}

/**
 * Admin Alert Banner - specialized for admin alerts
 */
interface AdminAlertBannerProps {
  alert: Alert & { category: 'ADMIN_SECURITY' | 'STORE_OWNER' };
  onDismiss?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onViewDetails?: () => void;
  className?: string;
}

export function AdminAlertBanner({
  alert,
  onDismiss,
  onResolve,
  onViewDetails,
  className
}: AdminAlertBannerProps) {
  const actions = [];

  // Add view details action for admin alerts
  if (onViewDetails) {
    actions.push({
      label: 'View Details',
      onClick: onViewDetails,
      variant: 'secondary' as const
    });
  }

  return (
    <AlertBanner
      alert={alert}
      onDismiss={onDismiss}
      onResolve={onResolve}
      actions={actions}
      className={className}
      showTimestamp={true}
    />
  );
}
