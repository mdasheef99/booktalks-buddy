/**
 * useAlerts Hook
 * 
 * Custom React hook for alert management in BookTalks Buddy.
 * Provides convenient access to alert operations and subscription-specific alert helpers.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Implementation - Phase 1
 */

import { useCallback } from 'react';
import { useAlerts as useAlertContext, useUserSubscriptionAlerts } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Alert,
  UserSubscriptionAlert,
  AlertType,
  AlertCategory,
  AlertPriority
} from '@/lib/alerts/types';
import {
  createRoleAccessDeniedAlert,
  createGracePeriodWarningAlert
} from '@/lib/alerts/alertManager';

// =========================
// Main useAlerts Hook
// =========================

/**
 * Enhanced useAlerts hook with subscription-specific helpers
 */
export function useAlerts() {
  const alertContext = useAlertContext();
  const { user } = useAuth();
  const subscriptionAlerts = useUserSubscriptionAlerts();

  // =========================
  // Subscription Alert Helpers
  // =========================

  /**
   * Show role access denied alert
   */
  const showRoleAccessDeniedAlert = useCallback((
    featureName: string,
    requiredTier: string
  ) => {
    if (!user) return;

    const alert = createRoleAccessDeniedAlert(user.id, featureName, requiredTier);
    alertContext.addAlert(alert);
  }, [user, alertContext]);

  /**
   * Show grace period warning alert
   */
  const showGracePeriodWarning = useCallback((
    roleName: string,
    daysRemaining: number
  ) => {
    if (!user) return;

    const alert = createGracePeriodWarningAlert(user.id, roleName, daysRemaining);
    alertContext.addAlert(alert);
  }, [user, alertContext]);

  /**
   * Check if user has active subscription alerts
   */
  const hasActiveSubscriptionAlerts = useCallback(() => {
    return subscriptionAlerts.length > 0;
  }, [subscriptionAlerts]);

  /**
   * Get subscription alerts by type
   */
  const getSubscriptionAlertsByType = useCallback((type: 'expired' | 'expiring' | 'access_denied' | 'grace_period') => {
    const typeMap = {
      expired: 'subscription_expired',
      expiring: 'subscription_expiry_warning',
      access_denied: 'role_access_denied',
      grace_period: 'grace_period_warning'
    };

    return subscriptionAlerts.filter(alert => alert.type === typeMap[type]);
  }, [subscriptionAlerts]);

  /**
   * Dismiss all subscription alerts
   */
  const dismissAllSubscriptionAlerts = useCallback(() => {
    subscriptionAlerts.forEach(alert => {
      alertContext.dismissAlert(alert.id);
    });
  }, [subscriptionAlerts, alertContext]);

  // =========================
  // Alert Filtering Helpers
  // =========================

  /**
   * Get alerts by multiple criteria
   */
  const getFilteredAlerts = useCallback((filters: {
    category?: AlertCategory;
    type?: AlertType;
    priority?: AlertPriority;
    userId?: string;
  }) => {
    let filteredAlerts = alertContext.alerts;

    if (filters.category) {
      filteredAlerts = alertContext.getAlertsByCategory(filters.category);
    }

    if (filters.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
    }

    if (filters.priority) {
      filteredAlerts = filteredAlerts.filter(alert => alert.priority === filters.priority);
    }

    if (filters.userId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.userId === filters.userId);
    }

    return filteredAlerts;
  }, [alertContext]);

  /**
   * Get user-specific alerts
   */
  const getUserAlerts = useCallback(() => {
    if (!user) return [];
    return getFilteredAlerts({ userId: user.id });
  }, [user, getFilteredAlerts]);

  /**
   * Get high priority alerts
   */
  const getHighPriorityAlerts = useCallback(() => {
    return [
      ...alertContext.getAlertsByPriority('CRITICAL'),
      ...alertContext.getAlertsByPriority('HIGH')
    ];
  }, [alertContext]);

  // =========================
  // Alert Status Helpers
  // =========================

  /**
   * Check if specific alert type exists for user
   */
  const hasAlertType = useCallback((type: AlertType) => {
    if (!user) return false;
    return alertContext.getAlertsByType(type).some(alert => alert.userId === user.id);
  }, [user, alertContext]);

  /**
   * Get alert count by category
   */
  const getAlertCountByCategory = useCallback((category: AlertCategory) => {
    return alertContext.getAlertsByCategory(category).length;
  }, [alertContext]);

  /**
   * Get total alert count for user
   */
  const getUserAlertCount = useCallback(() => {
    return getUserAlerts().length;
  }, [getUserAlerts]);

  // =========================
  // Return Enhanced Hook
  // =========================

  return {
    // Original context methods
    ...alertContext,

    // Subscription-specific alerts
    subscriptionAlerts,
    hasActiveSubscriptionAlerts,
    getSubscriptionAlertsByType,
    dismissAllSubscriptionAlerts,

    // Subscription alert creators
    showRoleAccessDeniedAlert,
    showGracePeriodWarning,

    // Enhanced filtering
    getFilteredAlerts,
    getUserAlerts,
    getHighPriorityAlerts,

    // Status helpers
    hasAlertType,
    getAlertCountByCategory,
    getUserAlertCount
  };
}

// =========================
// Specialized Hooks
// =========================

/**
 * Hook for subscription-related alerts only
 */
export function useSubscriptionAlerts() {
  const { 
    subscriptionAlerts,
    hasActiveSubscriptionAlerts,
    getSubscriptionAlertsByType,
    dismissAllSubscriptionAlerts,
    showRoleAccessDeniedAlert,
    showGracePeriodWarning
  } = useAlerts();

  return {
    alerts: subscriptionAlerts,
    hasActiveAlerts: hasActiveSubscriptionAlerts,
    getAlertsByType: getSubscriptionAlertsByType,
    dismissAll: dismissAllSubscriptionAlerts,
    showRoleAccessDenied: showRoleAccessDeniedAlert,
    showGracePeriodWarning
  };
}

/**
 * Hook for admin alerts only
 */
export function useAdminAlerts() {
  const { getAlertsByCategory, addAlert, dismissAlert, resolveAlert } = useAlerts();

  const adminAlerts = getAlertsByCategory('ADMIN_SECURITY');
  const storeOwnerAlerts = getAlertsByCategory('STORE_OWNER');

  return {
    securityAlerts: adminAlerts,
    storeOwnerAlerts,
    allAdminAlerts: [...adminAlerts, ...storeOwnerAlerts],
    addAlert,
    dismissAlert,
    resolveAlert
  };
}

/**
 * Hook for critical alerts monitoring
 */
export function useCriticalAlerts() {
  const { getAlertsByPriority, alerts } = useAlerts();

  const criticalAlerts = getAlertsByPriority('CRITICAL');
  const hasCriticalAlerts = criticalAlerts.length > 0;

  return {
    criticalAlerts,
    hasCriticalAlerts,
    criticalCount: criticalAlerts.length,
    totalAlerts: alerts.length
  };
}
