/**
 * Alert Context
 * 
 * React context for managing alert state throughout the BookTalks Buddy application.
 * Provides centralized alert management with integration to AuthContext and subscription system.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Implementation - Phase 1
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Alert,
  AlertCategory,
  AlertType,
  AlertPriority,
  AlertContextType,
  UserSubscriptionAlert
} from '@/lib/alerts/types';
import {
  validateAlert,
  shouldExpireAlert,
  dismissAlert,
  resolveAlert,
  filterAlertsByCategory,
  filterAlertsByPriority,
  sortAlertsByPriority,
  getActiveUserAlerts,
  createSubscriptionExpiredAlert,
  createSubscriptionExpiryWarningAlert
} from '@/lib/alerts/alertManager';
import {
  showSubscriptionExpiredToast,
  showSubscriptionExpiryWarningToast,
  showRoleAccessDeniedToast,
  showGracePeriodWarningToast
} from '@/components/alerts/AlertToast';

// =========================
// Context Setup
// =========================

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// =========================
// Reducer Types and Actions
// =========================

type AlertAction = 
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'RESOLVE_ALERT'; payload: string }
  | { type: 'CLEAR_ALERTS' }
  | { type: 'EXPIRE_ALERTS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface AlertState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

// =========================
// Reducer Implementation
// =========================

function alertReducer(state: AlertState, action: AlertAction): AlertState {
  switch (action.type) {
    case 'ADD_ALERT': {
      const newAlert = action.payload;
      
      // Validate alert before adding
      const validation = validateAlert(newAlert);
      if (!validation.valid) {
        console.error('[AlertContext] Invalid alert:', validation.errors);
        return {
          ...state,
          error: `Invalid alert: ${validation.errors.join(', ')}`
        };
      }

      // Check for duplicate alerts of the same type for the same user
      const existingAlert = state.alerts.find(alert => 
        alert.type === newAlert.type && 
        alert.userId === newAlert.userId &&
        alert.status === 'active'
      );

      if (existingAlert) {
        // Update existing alert instead of creating duplicate
        return {
          ...state,
          alerts: state.alerts.map(alert => 
            alert.id === existingAlert.id ? newAlert : alert
          ),
          error: null
        };
      }

      return {
        ...state,
        alerts: [...state.alerts, newAlert],
        error: null
      };
    }

    case 'DISMISS_ALERT': {
      return {
        ...state,
        alerts: state.alerts.map(alert => 
          alert.id === action.payload ? dismissAlert(alert) : alert
        )
      };
    }

    case 'RESOLVE_ALERT': {
      return {
        ...state,
        alerts: state.alerts.map(alert => 
          alert.id === action.payload ? resolveAlert(alert) : alert
        )
      };
    }

    case 'CLEAR_ALERTS': {
      return {
        ...state,
        alerts: []
      };
    }

    case 'EXPIRE_ALERTS': {
      return {
        ...state,
        alerts: state.alerts.filter(alert => !shouldExpireAlert(alert))
      };
    }

    case 'SET_LOADING': {
      return {
        ...state,
        loading: action.payload
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload
      };
    }

    default:
      return state;
  }
}

// =========================
// Provider Component
// =========================

interface AlertProviderProps {
  children: React.ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const { user, subscriptionStatus, getSubscriptionStatusWithContext } = useAuth();
  
  const [state, dispatch] = useReducer(alertReducer, {
    alerts: [],
    loading: false,
    error: null
  });

  // =========================
  // Alert Management Functions
  // =========================

  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'createdAt' | 'status'>) => {
    const alert: Alert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'active'
    } as Alert;

    dispatch({ type: 'ADD_ALERT', payload: alert });

    // Automatically show toast notification for subscription alerts
    if (alert.category === 'USER_SUBSCRIPTION') {
      const subscriptionAlert = alert as UserSubscriptionAlert;

      switch (alert.type) {
        case 'subscription_expired':
          showSubscriptionExpiredToast(
            subscriptionAlert.subscriptionData?.currentTier || 'PRIVILEGED',
            () => {
              // TODO: Add contact store functionality
              console.log('Contact store clicked for subscription renewal');
            }
          );
          break;

        case 'subscription_expiry_warning':
          showSubscriptionExpiryWarningToast(
            subscriptionAlert.subscriptionData?.daysRemaining || 0,
            () => {
              // TODO: Add contact store functionality
              console.log('Contact store clicked for subscription renewal');
            }
          );
          break;

        case 'role_access_denied':
          // Extract feature name and required tier from alert message or data
          showRoleAccessDeniedToast(
            'Premium Feature',
            'PRIVILEGED',
            () => {
              console.log('Contact store clicked for access upgrade');
            }
          );
          break;

        case 'grace_period_warning':
          showGracePeriodWarningToast(
            'Club Leadership',
            subscriptionAlert.subscriptionData?.daysRemaining || 0,
            () => {
              console.log('Contact store clicked for subscription renewal');
            }
          );
          break;
      }
    }
  }, []);

  const dismissAlertById = useCallback((alertId: string) => {
    dispatch({ type: 'DISMISS_ALERT', payload: alertId });
  }, []);

  const resolveAlertById = useCallback((alertId: string) => {
    dispatch({ type: 'RESOLVE_ALERT', payload: alertId });
  }, []);

  const clearAlerts = useCallback(() => {
    dispatch({ type: 'CLEAR_ALERTS' });
  }, []);

  const getAlertsByCategory = useCallback((category: AlertCategory) => {
    return filterAlertsByCategory(state.alerts, category);
  }, [state.alerts]);

  const getAlertsByType = useCallback((type: AlertType) => {
    return state.alerts.filter(alert => alert.type === type);
  }, [state.alerts]);

  const getAlertsByPriority = useCallback((priority: AlertPriority) => {
    return filterAlertsByPriority(state.alerts, priority);
  }, [state.alerts]);

  // =========================
  // Subscription Alert Management
  // =========================

  const checkSubscriptionAlerts = useCallback(() => {
    if (!user || !subscriptionStatus) return;

    const statusContext = getSubscriptionStatusWithContext();

    // Check for expired subscription using new subscription history logic
    if (subscriptionStatus.hadPremiumSubscription && !subscriptionStatus.hasActiveSubscription) {
      // This user had a premium subscription that expired
      const expiredAlert = createSubscriptionExpiredAlert(user.id, {
        currentTier: subscriptionStatus.mostRecentSubscriptionTier || 'PRIVILEGED',
        expiryDate: subscriptionStatus.subscriptionExpiry || new Date().toISOString(),
        hasActiveSubscription: false
      });

      dispatch({ type: 'ADD_ALERT', payload: expiredAlert });
    }
    // Fallback to old logic for backward compatibility
    else if (statusContext.needsUpgrade && statusContext.expiryDate) {
      // This user had a subscription that expired (old logic)
      const expiredAlert = createSubscriptionExpiredAlert(user.id, {
        currentTier: statusContext.tier === 'MEMBER' ? 'PRIVILEGED' : statusContext.tier,
        expiryDate: statusContext.expiryDate,
        hasActiveSubscription: false
      });

      dispatch({ type: 'ADD_ALERT', payload: expiredAlert });
    }

    // Check for expiry warning (7 days) - only for active subscriptions
    if (statusContext.hasActiveSubscription && statusContext.expiryDate && !statusContext.needsUpgrade) {
      const expiryDate = new Date(statusContext.expiryDate);
      const today = new Date();
      const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 7 && daysRemaining > 0) {
        const warningAlert = createSubscriptionExpiryWarningAlert(user.id, {
          currentTier: statusContext.tier,
          expiryDate: statusContext.expiryDate,
          daysRemaining,
          hasActiveSubscription: true
        });

        dispatch({ type: 'ADD_ALERT', payload: warningAlert });
      }
    }
  }, [user, subscriptionStatus, getSubscriptionStatusWithContext]);

  // =========================
  // Effects
  // =========================

  // Check subscription alerts when subscription status changes
  useEffect(() => {
    checkSubscriptionAlerts();
  }, [checkSubscriptionAlerts]);

  // Expire old alerts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'EXPIRE_ALERTS' });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // =========================
  // Context Value
  // =========================

  const contextValue: AlertContextType = {
    // State
    alerts: sortAlertsByPriority(state.alerts.filter(alert => alert.status === 'active')),
    loading: state.loading,
    error: state.error,

    // Actions
    addAlert,
    dismissAlert: dismissAlertById,
    resolveAlert: resolveAlertById,
    clearAlerts,
    getAlertsByCategory,
    getAlertsByType,
    getAlertsByPriority
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
    </AlertContext.Provider>
  );
}

// =========================
// Hook
// =========================

export function useAlerts(): AlertContextType {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}

// =========================
// Utility Hooks
// =========================

/**
 * Hook to get user-specific subscription alerts
 */
export function useUserSubscriptionAlerts(): UserSubscriptionAlert[] {
  const { alerts } = useAlerts();
  const { user } = useAuth();

  if (!user) return [];

  return getActiveUserAlerts(alerts, user.id).filter(
    alert => alert.category === 'USER_SUBSCRIPTION'
  ) as UserSubscriptionAlert[];
}

/**
 * Hook to get critical alerts count
 */
export function useCriticalAlertsCount(): number {
  const { getAlertsByPriority } = useAlerts();
  return getAlertsByPriority('CRITICAL').length;
}
