/**
 * Alert Manager
 * 
 * Core alert management system for BookTalks Buddy.
 * Handles alert creation, validation, lifecycle management, and persistence.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Implementation - Phase 1
 */

import { 
  Alert, 
  AlertType, 
  AlertCategory, 
  AlertPriority, 
  AlertStatus,
  UserSubscriptionAlert,
  AdminSecurityAlert,
  StoreOwnerAlert,
  ALERT_CATEGORIES,
  ALERT_DISPLAY_CONFIG
} from './types';

// =========================
// Alert Creation Utilities
// =========================

/**
 * Generate unique alert ID
 */
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create base alert with common properties
 */
function createBaseAlert(
  type: AlertType,
  title: string,
  message: string,
  userId?: string,
  metadata?: Record<string, any>
): Omit<Alert, 'subscriptionData' | 'securityData' | 'storeData'> {
  const config = ALERT_CATEGORIES[type];
  const displayConfig = ALERT_DISPLAY_CONFIG[type];
  
  return {
    id: generateAlertId(),
    type,
    priority: config.priority,
    category: config.category,
    title,
    message,
    displayType: displayConfig.duration === 0 ? 'banner' : 'toast',
    status: 'active' as AlertStatus,
    createdAt: new Date().toISOString(),
    userId,
    metadata
  };
}

// =========================
// User Subscription Alerts
// =========================

/**
 * Create subscription expired alert
 */
export function createSubscriptionExpiredAlert(
  userId: string,
  subscriptionData: {
    currentTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
    expiryDate: string;
    hasActiveSubscription: boolean;
  }
): UserSubscriptionAlert {
  const baseAlert = createBaseAlert(
    'subscription_expired',
    'Subscription Expired',
    'Your subscription has expired. Some features may be limited until you renew.',
    userId
  );

  return {
    ...baseAlert,
    type: 'subscription_expired',
    category: 'USER_SUBSCRIPTION',
    subscriptionData: {
      ...subscriptionData,
      daysRemaining: 0
    }
  } as UserSubscriptionAlert;
}

/**
 * Create subscription expiry warning alert
 */
export function createSubscriptionExpiryWarningAlert(
  userId: string,
  subscriptionData: {
    currentTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
    expiryDate: string;
    daysRemaining: number;
    hasActiveSubscription: boolean;
  }
): UserSubscriptionAlert {
  const baseAlert = createBaseAlert(
    'subscription_expiry_warning',
    'Subscription Expiring Soon',
    `Your subscription expires in ${subscriptionData.daysRemaining} days. Contact your store to renew.`,
    userId
  );

  return {
    ...baseAlert,
    type: 'subscription_expiry_warning',
    category: 'USER_SUBSCRIPTION',
    subscriptionData
  } as UserSubscriptionAlert;
}

/**
 * Create role access denied alert
 */
export function createRoleAccessDeniedAlert(
  userId: string,
  featureName: string,
  requiredTier: string
): UserSubscriptionAlert {
  const baseAlert = createBaseAlert(
    'role_access_denied',
    'Access Denied',
    `${featureName} requires an active ${requiredTier} subscription. Contact your store owner to upgrade.`,
    userId,
    { featureName, requiredTier }
  );

  return {
    ...baseAlert,
    type: 'role_access_denied',
    category: 'USER_SUBSCRIPTION',
    subscriptionData: {
      currentTier: 'MEMBER',
      hasActiveSubscription: false
    }
  } as UserSubscriptionAlert;
}

/**
 * Create grace period warning alert
 */
export function createGracePeriodWarningAlert(
  userId: string,
  roleName: string,
  daysRemaining: number
): UserSubscriptionAlert {
  const baseAlert = createBaseAlert(
    'grace_period_warning',
    'Role Access Ending Soon',
    `Your ${roleName} access expires in ${daysRemaining} days. Renew your subscription to maintain access.`,
    userId,
    { roleName, daysRemaining }
  );

  return {
    ...baseAlert,
    type: 'grace_period_warning',
    category: 'USER_SUBSCRIPTION',
    subscriptionData: {
      currentTier: 'MEMBER',
      daysRemaining,
      hasActiveSubscription: false
    }
  } as UserSubscriptionAlert;
}

// =========================
// Admin Security Alerts
// =========================

/**
 * Create role bypass detected alert
 */
export function createRoleBypassDetectedAlert(
  affectedUserId: string,
  bypassMethod: string
): AdminSecurityAlert {
  const baseAlert = createBaseAlert(
    'role_bypass_detected',
    'Security Violation Detected',
    `User is accessing premium features without valid subscription via ${bypassMethod}`,
    undefined,
    { affectedUserId, bypassMethod }
  );

  return {
    ...baseAlert,
    type: 'role_bypass_detected',
    category: 'ADMIN_SECURITY',
    securityData: {
      severity: 'critical',
      affectedUserId,
      bypassMethod,
      detectionTime: new Date().toISOString(),
      resolved: false
    }
  } as AdminSecurityAlert;
}

/**
 * Create subscription enforcement violation alert
 */
export function createSubscriptionEnforcementViolationAlert(
  affectedUserId: string,
  violationType: string
): AdminSecurityAlert {
  const baseAlert = createBaseAlert(
    'subscription_enforcement_violation',
    'Subscription Enforcement Violation',
    `Subscription enforcement violation detected: ${violationType}`,
    undefined,
    { affectedUserId, violationType }
  );

  return {
    ...baseAlert,
    type: 'subscription_enforcement_violation',
    category: 'ADMIN_SECURITY',
    securityData: {
      severity: 'high',
      affectedUserId,
      bypassMethod: violationType,
      detectionTime: new Date().toISOString(),
      resolved: false
    }
  } as AdminSecurityAlert;
}

// =========================
// Store Owner Alerts
// =========================

/**
 * Create expired users with roles alert
 */
export function createExpiredUsersWithRolesAlert(
  affectedUserCount: number,
  quickActions: string[] = []
): StoreOwnerAlert {
  const baseAlert = createBaseAlert(
    'expired_users_with_roles',
    'Users with Expired Subscriptions',
    `${affectedUserCount} users have premium roles but expired subscriptions`,
    undefined,
    { affectedUserCount }
  );

  return {
    ...baseAlert,
    type: 'expired_users_with_roles',
    category: 'STORE_OWNER',
    storeData: {
      affectedUserCount,
      actionRequired: true,
      quickActions
    }
  } as StoreOwnerAlert;
}

// =========================
// Alert Validation
// =========================

/**
 * Validate alert data structure
 */
export function validateAlert(alert: Alert): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields validation
  if (!alert.id) errors.push('Alert ID is required');
  if (!alert.type) errors.push('Alert type is required');
  if (!alert.title) errors.push('Alert title is required');
  if (!alert.message) errors.push('Alert message is required');
  if (!alert.createdAt) errors.push('Alert creation timestamp is required');

  // Type validation
  if (alert.type && !ALERT_CATEGORIES[alert.type]) {
    errors.push(`Invalid alert type: ${alert.type}`);
  }

  // Category consistency validation
  if (alert.type && alert.category !== ALERT_CATEGORIES[alert.type].category) {
    errors.push(`Alert category ${alert.category} does not match type ${alert.type}`);
  }

  // Priority consistency validation
  if (alert.type && alert.priority !== ALERT_CATEGORIES[alert.type].priority) {
    errors.push(`Alert priority ${alert.priority} does not match type ${alert.type}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// =========================
// Alert Lifecycle Management
// =========================

/**
 * Check if alert should be expired
 */
export function shouldExpireAlert(alert: Alert): boolean {
  if (!alert.expiresAt) return false;
  return new Date(alert.expiresAt) <= new Date();
}

/**
 * Update alert status
 */
export function updateAlertStatus(alert: Alert, status: AlertStatus): Alert {
  return {
    ...alert,
    status,
    metadata: {
      ...alert.metadata,
      statusUpdatedAt: new Date().toISOString()
    }
  };
}

/**
 * Dismiss alert
 */
export function dismissAlert(alert: Alert): Alert {
  return updateAlertStatus(alert, 'dismissed');
}

/**
 * Resolve alert
 */
export function resolveAlert(alert: Alert): Alert {
  return updateAlertStatus(alert, 'resolved');
}

// =========================
// Alert Filtering and Sorting
// =========================

/**
 * Filter alerts by category
 */
export function filterAlertsByCategory(alerts: Alert[], category: AlertCategory): Alert[] {
  return alerts.filter(alert => alert.category === category);
}

/**
 * Filter alerts by priority
 */
export function filterAlertsByPriority(alerts: Alert[], priority: AlertPriority): Alert[] {
  return alerts.filter(alert => alert.priority === priority);
}

/**
 * Filter alerts by status
 */
export function filterAlertsByStatus(alerts: Alert[], status: AlertStatus): Alert[] {
  return alerts.filter(alert => alert.status === status);
}

/**
 * Sort alerts by priority (CRITICAL first)
 */
export function sortAlertsByPriority(alerts: Alert[]): Alert[] {
  const priorityOrder: Record<AlertPriority, number> = {
    'CRITICAL': 0,
    'HIGH': 1,
    'MEDIUM': 2,
    'LOW': 3
  };

  return [...alerts].sort((a, b) => {
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same priority, sort by creation time (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Get active alerts for user
 */
export function getActiveUserAlerts(alerts: Alert[], userId: string): Alert[] {
  return alerts.filter(alert => 
    alert.userId === userId && 
    alert.status === 'active' &&
    !shouldExpireAlert(alert)
  );
}
