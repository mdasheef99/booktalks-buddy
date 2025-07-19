/**
 * Alert System Types
 * 
 * Type definitions for the BookTalks Buddy alert system.
 * Provides comprehensive typing for user-facing alerts, admin security alerts,
 * and store owner notifications.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Implementation - Phase 1
 */

// =========================
// Core Alert Types
// =========================

/**
 * Alert priority levels
 */
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Alert categories based on target audience and purpose
 */
export type AlertCategory = 'USER_SUBSCRIPTION' | 'ADMIN_SECURITY' | 'STORE_OWNER';

/**
 * Alert display types
 */
export type AlertDisplayType = 'banner' | 'toast' | 'modal' | 'notification';

/**
 * Alert status for tracking and management
 */
export type AlertStatus = 'active' | 'dismissed' | 'resolved' | 'expired';

// =========================
// Alert Type Definitions
// =========================

/**
 * User subscription alert types
 */
export type UserSubscriptionAlertType = 
  | 'subscription_expiry_warning'
  | 'subscription_expired'
  | 'role_access_denied'
  | 'grace_period_warning';

/**
 * Admin security alert types
 */
export type AdminSecurityAlertType = 
  | 'role_bypass_detected'
  | 'subscription_enforcement_violation'
  | 'system_health_warning';

/**
 * Store owner alert types
 */
export type StoreOwnerAlertType = 
  | 'expired_users_with_roles'
  | 'subscription_system_health';

/**
 * Combined alert type union
 */
export type AlertType = UserSubscriptionAlertType | AdminSecurityAlertType | StoreOwnerAlertType;

// =========================
// Alert Configuration
// =========================

/**
 * Alert configuration mapping types to priorities and categories
 */
export const ALERT_CATEGORIES: Record<AlertType, { priority: AlertPriority; category: AlertCategory }> = {
  // User subscription alerts
  'subscription_expiry_warning': { priority: 'MEDIUM', category: 'USER_SUBSCRIPTION' },
  'subscription_expired': { priority: 'HIGH', category: 'USER_SUBSCRIPTION' },
  'role_access_denied': { priority: 'HIGH', category: 'USER_SUBSCRIPTION' },
  'grace_period_warning': { priority: 'MEDIUM', category: 'USER_SUBSCRIPTION' },
  
  // Admin security alerts
  'role_bypass_detected': { priority: 'CRITICAL', category: 'ADMIN_SECURITY' },
  'subscription_enforcement_violation': { priority: 'HIGH', category: 'ADMIN_SECURITY' },
  'system_health_warning': { priority: 'MEDIUM', category: 'ADMIN_SECURITY' },
  
  // Store owner alerts
  'expired_users_with_roles': { priority: 'HIGH', category: 'STORE_OWNER' },
  'subscription_system_health': { priority: 'MEDIUM', category: 'STORE_OWNER' }
};

// =========================
// Alert Data Structures
// =========================

/**
 * Base alert interface
 */
export interface BaseAlert {
  /** Unique alert identifier */
  id: string;
  
  /** Alert type */
  type: AlertType;
  
  /** Alert priority level */
  priority: AlertPriority;
  
  /** Alert category */
  category: AlertCategory;
  
  /** Alert title */
  title: string;
  
  /** Alert message content */
  message: string;
  
  /** Alert display type */
  displayType: AlertDisplayType;
  
  /** Alert status */
  status: AlertStatus;
  
  /** Timestamp when alert was created */
  createdAt: string;
  
  /** Timestamp when alert expires (optional) */
  expiresAt?: string;
  
  /** User ID this alert is for (null for system-wide alerts) */
  userId?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * User subscription alert interface
 */
export interface UserSubscriptionAlert extends BaseAlert {
  type: UserSubscriptionAlertType;
  category: 'USER_SUBSCRIPTION';
  
  /** Subscription-specific data */
  subscriptionData?: {
    currentTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
    expiryDate?: string;
    daysRemaining?: number;
    hasActiveSubscription: boolean;
  };
}

/**
 * Admin security alert interface
 */
export interface AdminSecurityAlert extends BaseAlert {
  type: AdminSecurityAlertType;
  category: 'ADMIN_SECURITY';
  
  /** Security-specific data */
  securityData?: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedUserId?: string;
    bypassMethod?: string;
    detectionTime: string;
    resolved: boolean;
  };
}

/**
 * Store owner alert interface
 */
export interface StoreOwnerAlert extends BaseAlert {
  type: StoreOwnerAlertType;
  category: 'STORE_OWNER';
  
  /** Store management specific data */
  storeData?: {
    affectedUserCount?: number;
    healthScore?: number;
    actionRequired: boolean;
    quickActions?: string[];
  };
}

/**
 * Union type for all alert types
 */
export type Alert = UserSubscriptionAlert | AdminSecurityAlert | StoreOwnerAlert;

// =========================
// Alert Action Types
// =========================

/**
 * Alert action interface for user interactions
 */
export interface AlertAction {
  /** Action identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Action type */
  type: 'primary' | 'secondary' | 'dismiss';
  
  /** Action handler */
  handler: () => void | Promise<void>;
  
  /** Whether action is destructive */
  destructive?: boolean;
}

// =========================
// Alert Context Types
// =========================

/**
 * Alert context state interface
 */
export interface AlertContextState {
  /** Active alerts */
  alerts: Alert[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: string | null;
}

/**
 * Alert context actions interface
 */
export interface AlertContextActions {
  /** Add new alert */
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'status'>) => void;
  
  /** Dismiss alert */
  dismissAlert: (alertId: string) => void;
  
  /** Resolve alert */
  resolveAlert: (alertId: string) => void;
  
  /** Clear all alerts */
  clearAlerts: () => void;
  
  /** Get alerts by category */
  getAlertsByCategory: (category: AlertCategory) => Alert[];
  
  /** Get alerts by type */
  getAlertsByType: (type: AlertType) => Alert[];
  
  /** Get alerts by priority */
  getAlertsByPriority: (priority: AlertPriority) => Alert[];
}

/**
 * Combined alert context type
 */
export interface AlertContextType extends AlertContextState, AlertContextActions {}

// =========================
// Alert Display Configuration
// =========================

/**
 * Alert display configuration for different types
 */
export interface AlertDisplayConfig {
  /** Display duration in milliseconds (0 = persistent) */
  duration: number;
  
  /** Whether alert can be dismissed */
  dismissible: boolean;
  
  /** Whether alert should auto-dismiss */
  autoDismiss: boolean;
  
  /** CSS classes for styling */
  className: string;
  
  /** Icon component name */
  icon?: string;
  
  /** Actions available for this alert */
  actions?: AlertAction[];
}

/**
 * Alert display configuration mapping
 */
export const ALERT_DISPLAY_CONFIG: Record<AlertType, AlertDisplayConfig> = {
  // User subscription alerts - persistent banners
  'subscription_expiry_warning': {
    duration: 0,
    dismissible: true,
    autoDismiss: false,
    className: 'bg-orange-50 border-orange-200 text-orange-800',
    icon: 'AlertTriangle'
  },
  'subscription_expired': {
    duration: 0,
    dismissible: false,
    autoDismiss: false,
    className: 'bg-red-50 border-red-200 text-red-800',
    icon: 'XCircle'
  },
  'role_access_denied': {
    duration: 5000,
    dismissible: true,
    autoDismiss: true,
    className: 'bg-red-50 border-red-200 text-red-800',
    icon: 'Shield'
  },
  'grace_period_warning': {
    duration: 0,
    dismissible: true,
    autoDismiss: false,
    className: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: 'Clock'
  },
  
  // Admin security alerts - critical notifications
  'role_bypass_detected': {
    duration: 0,
    dismissible: false,
    autoDismiss: false,
    className: 'bg-red-100 border-red-300 text-red-900',
    icon: 'AlertTriangle'
  },
  'subscription_enforcement_violation': {
    duration: 0,
    dismissible: true,
    autoDismiss: false,
    className: 'bg-orange-100 border-orange-300 text-orange-900',
    icon: 'Shield'
  },
  'system_health_warning': {
    duration: 0,
    dismissible: true,
    autoDismiss: false,
    className: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    icon: 'AlertCircle'
  },
  
  // Store owner alerts - dashboard notifications
  'expired_users_with_roles': {
    duration: 0,
    dismissible: true,
    autoDismiss: false,
    className: 'bg-red-100 border-red-300 text-red-900',
    icon: 'Users'
  },
  'subscription_system_health': {
    duration: 0,
    dismissible: true,
    autoDismiss: false,
    className: 'bg-blue-100 border-blue-300 text-blue-900',
    icon: 'Activity'
  }
};
