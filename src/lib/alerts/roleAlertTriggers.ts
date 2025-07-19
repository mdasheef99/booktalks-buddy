/**
 * Role Alert Triggers
 * 
 * Integration layer between role validation and alert system.
 * Triggers appropriate alerts when users attempt to access features without proper subscriptions.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Implementation - Phase 1
 */

import { createRoleAccessDeniedAlert } from './alertManager';
import { showRoleAccessDeniedToast } from '@/components/alerts/AlertToast';

// =========================
// Feature Requirements Mapping
// =========================

/**
 * Map of features to their subscription requirements
 */
export const FEATURE_SUBSCRIPTION_REQUIREMENTS = {
  // Club Management Features
  'club_creation': {
    requiredTier: 'PRIVILEGED',
    featureName: 'Club Creation',
    description: 'Create and manage book clubs'
  },
  'club_leadership': {
    requiredTier: 'PRIVILEGED',
    featureName: 'Club Leadership',
    description: 'Lead and moderate book clubs'
  },
  'unlimited_club_creation': {
    requiredTier: 'PRIVILEGED_PLUS',
    featureName: 'Unlimited Club Creation',
    description: 'Create unlimited book clubs'
  },
  
  // Store Management Features
  'store_management': {
    requiredTier: 'PRIVILEGED_PLUS',
    featureName: 'Store Management',
    description: 'Manage store settings and inventory'
  },
  'advanced_analytics': {
    requiredTier: 'PRIVILEGED_PLUS',
    featureName: 'Advanced Analytics',
    description: 'Access detailed analytics and reports'
  },
  
  // Premium Content Features
  'premium_content': {
    requiredTier: 'PRIVILEGED',
    featureName: 'Premium Content',
    description: 'Access premium books and discussions'
  },
  'exclusive_content': {
    requiredTier: 'PRIVILEGED_PLUS',
    featureName: 'Exclusive Content',
    description: 'Access exclusive premium content'
  },
  
  // Communication Features
  'direct_messaging': {
    requiredTier: 'PRIVILEGED',
    featureName: 'Direct Messaging',
    description: 'Send direct messages to other members'
  },
  'priority_support': {
    requiredTier: 'PRIVILEGED_PLUS',
    featureName: 'Priority Support',
    description: 'Get priority customer support'
  }
} as const;

export type FeatureKey = keyof typeof FEATURE_SUBSCRIPTION_REQUIREMENTS;

// =========================
// Role Access Validation
// =========================

/**
 * Check if user has required subscription for feature
 */
export function hasRequiredSubscriptionForFeature(
  userTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
  hasActiveSubscription: boolean,
  featureKey: FeatureKey
): boolean {
  const requirement = FEATURE_SUBSCRIPTION_REQUIREMENTS[featureKey];
  
  // If no active subscription, only MEMBER tier features are allowed
  if (!hasActiveSubscription) {
    return false; // All mapped features require active subscription
  }
  
  // Check tier hierarchy
  const tierHierarchy = {
    'MEMBER': 1,
    'PRIVILEGED': 2,
    'PRIVILEGED_PLUS': 3
  };
  
  const userTierLevel = tierHierarchy[userTier];
  const requiredTierLevel = tierHierarchy[requirement.requiredTier as keyof typeof tierHierarchy];
  
  return userTierLevel >= requiredTierLevel;
}

/**
 * Validate feature access and trigger alerts if denied
 */
export function validateFeatureAccessWithAlerts(
  userId: string,
  userTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
  hasActiveSubscription: boolean,
  featureKey: FeatureKey,
  options: {
    showToast?: boolean;
    addToAlertContext?: boolean;
    onContactStore?: () => void;
  } = {}
): {
  hasAccess: boolean;
  alertTriggered: boolean;
} {
  const hasAccess = hasRequiredSubscriptionForFeature(userTier, hasActiveSubscription, featureKey);
  
  if (hasAccess) {
    return { hasAccess: true, alertTriggered: false };
  }
  
  // Access denied - trigger appropriate alerts
  const requirement = FEATURE_SUBSCRIPTION_REQUIREMENTS[featureKey];
  
  // Show toast notification if requested
  if (options.showToast !== false) { // Default to true
    showRoleAccessDeniedToast(
      requirement.featureName,
      requirement.requiredTier,
      options.onContactStore
    );
  }
  
  return { hasAccess: false, alertTriggered: true };
}

// =========================
// Specific Feature Validators
// =========================

/**
 * Validate club creation access
 */
export function validateClubCreationAccess(
  userId: string,
  userTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
  hasActiveSubscription: boolean,
  onContactStore?: () => void
) {
  return validateFeatureAccessWithAlerts(
    userId,
    userTier,
    hasActiveSubscription,
    'club_creation',
    { onContactStore }
  );
}

/**
 * Validate club leadership access
 */
export function validateClubLeadershipAccess(
  userId: string,
  userTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
  hasActiveSubscription: boolean,
  onContactStore?: () => void
) {
  return validateFeatureAccessWithAlerts(
    userId,
    userTier,
    hasActiveSubscription,
    'club_leadership',
    { onContactStore }
  );
}

/**
 * Validate store management access
 */
export function validateStoreManagementAccess(
  userId: string,
  userTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
  hasActiveSubscription: boolean,
  onContactStore?: () => void
) {
  return validateFeatureAccessWithAlerts(
    userId,
    userTier,
    hasActiveSubscription,
    'store_management',
    { onContactStore }
  );
}

/**
 * Validate premium content access
 */
export function validatePremiumContentAccess(
  userId: string,
  userTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
  hasActiveSubscription: boolean,
  onContactStore?: () => void
) {
  return validateFeatureAccessWithAlerts(
    userId,
    userTier,
    hasActiveSubscription,
    'premium_content',
    { onContactStore }
  );
}

/**
 * Validate direct messaging access
 */
export function validateDirectMessagingAccess(
  userId: string,
  userTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
  hasActiveSubscription: boolean,
  onContactStore?: () => void
) {
  return validateFeatureAccessWithAlerts(
    userId,
    userTier,
    hasActiveSubscription,
    'direct_messaging',
    { onContactStore }
  );
}

// =========================
// Bulk Feature Validation
// =========================

/**
 * Validate multiple features at once
 */
export function validateMultipleFeatures(
  userId: string,
  userTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
  hasActiveSubscription: boolean,
  features: FeatureKey[],
  onContactStore?: () => void
): Record<FeatureKey, boolean> {
  const results: Record<string, boolean> = {};
  
  features.forEach(feature => {
    const validation = validateFeatureAccessWithAlerts(
      userId,
      userTier,
      hasActiveSubscription,
      feature,
      { showToast: false, onContactStore } // Don't show toast for bulk validation
    );
    results[feature] = validation.hasAccess;
  });
  
  return results as Record<FeatureKey, boolean>;
}

// =========================
// Integration Helpers
// =========================

/**
 * Create a feature access guard hook
 */
export function createFeatureAccessGuard(featureKey: FeatureKey) {
  return function useFeatureAccessGuard(
    userId: string,
    userTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
    hasActiveSubscription: boolean,
    onContactStore?: () => void
  ) {
    const checkAccess = () => {
      return validateFeatureAccessWithAlerts(
        userId,
        userTier,
        hasActiveSubscription,
        featureKey,
        { onContactStore }
      );
    };
    
    return {
      hasAccess: hasRequiredSubscriptionForFeature(userTier, hasActiveSubscription, featureKey),
      checkAccessWithAlert: checkAccess,
      requirement: FEATURE_SUBSCRIPTION_REQUIREMENTS[featureKey]
    };
  };
}

// =========================
// Pre-built Feature Guards
// =========================

export const useClubCreationGuard = createFeatureAccessGuard('club_creation');
export const useClubLeadershipGuard = createFeatureAccessGuard('club_leadership');
export const useStoreManagementGuard = createFeatureAccessGuard('store_management');
export const usePremiumContentGuard = createFeatureAccessGuard('premium_content');
export const useDirectMessagingGuard = createFeatureAccessGuard('direct_messaging');
