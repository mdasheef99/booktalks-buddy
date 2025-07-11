/**
 * Subscription API Integration Layer
 * 
 * Unified API interface that combines validation and caching for the BookTalks Buddy
 * subscription system. Provides backward compatibility with existing code while
 * integrating the new secure validation and caching infrastructure.
 * 
 * Created: 2025-01-07
 * Part of: Phase 1 - Foundation & API Layer
 */

// =========================
// Core Exports
// =========================

// Type definitions
export type {
  SubscriptionStatus,
  SubscriptionValidationResult,
  EntitlementValidationResult,
  ValidationError,
  ValidationOptions,
  ValidationPerformanceMetrics,
  CacheConfig,
  CacheOperationResult,
  SubscriptionTierHierarchy,
  SubscriptionState,
  ValidationStatus,
  SubscriptionFeatureFlags,
} from './types';

// Constants
export {
  DEFAULT_VALIDATION_OPTIONS,
  DEFAULT_CACHE_CONFIG,
  TIER_HIERARCHY,
  MAX_VALIDATION_TIMEOUT,
  MIN_CACHE_TTL,
} from './types';

// Core validation functions
export {
  validateUserSubscription,
  validateUserEntitlements,
  batchValidateSubscriptions,
  hasActiveSubscription,
  getUserSubscriptionTier,
} from './validation';

// Caching functions
export {
  getCachedSubscriptionStatus,
  hasCachedActiveSubscription,
  warmSubscriptionCache,
  invalidateUserCache,
  invalidateMultipleUserCache,
  getCacheStats,
  clearSubscriptionCache,
  performCacheMaintenance,
  subscriptionCache,
} from './cache';

// =========================
// Unified API Interface
// =========================

import {
  SubscriptionStatus,
  SubscriptionValidationResult,
  ValidationOptions,
} from './types';
import { getCachedSubscriptionStatus, hasCachedActiveSubscription } from './cache';
import { validateUserSubscription, hasActiveSubscription } from './validation';

/**
 * Primary subscription validation function with intelligent caching
 * 
 * This is the main function that should be used throughout the application
 * for subscription validation. It automatically handles caching and provides
 * optimal performance while maintaining security.
 * 
 * @param userId - User ID to validate
 * @param options - Validation options
 * @returns Promise<SubscriptionStatus> - Complete subscription status
 */
export async function getSubscriptionStatus(
  userId: string,
  options: {
    useCache?: boolean;
    forceRefresh?: boolean;
    timeout?: number;
  } = {}
): Promise<SubscriptionStatus> {
  const { useCache = true, forceRefresh = false, timeout = 5000 } = options;

  try {
    if (useCache && !forceRefresh) {
      // Use cached version for optimal performance
      return await getCachedSubscriptionStatus(userId, forceRefresh);
    } else {
      // Direct validation without caching
      const result = await validateUserSubscription(userId, { timeout });
      return result.status;
    }
  } catch (error) {
    console.error('[Subscription API] Error getting subscription status:', error);
    
    // Fail secure - return basic member status
    return {
      hasActiveSubscription: false,
      currentTier: 'MEMBER',
      subscriptionExpiry: null,
      isValid: false,
      lastValidated: new Date().toISOString(),
      validationSource: 'fallback',
      warnings: ['API error - defaulting to MEMBER tier for security'],
    };
  }
}

/**
 * Quick subscription check for performance-critical operations
 * 
 * @param userId - User ID to check
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise<boolean> - True if user has active subscription
 */
export async function checkActiveSubscription(
  userId: string,
  useCache: boolean = true
): Promise<boolean> {
  try {
    if (useCache) {
      return await hasCachedActiveSubscription(userId);
    } else {
      return await hasActiveSubscription(userId);
    }
  } catch (error) {
    console.error('[Subscription API] Error checking active subscription:', error);
    return false; // Fail secure
  }
}

/**
 * Get user's subscription tier with caching
 * 
 * @param userId - User ID to check
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise<string> - User's subscription tier
 */
export async function getSubscriptionTier(
  userId: string,
  useCache: boolean = true
): Promise<'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS'> {
  try {
    const status = await getSubscriptionStatus(userId, { useCache });
    return status.currentTier;
  } catch (error) {
    console.error('[Subscription API] Error getting subscription tier:', error);
    return 'MEMBER'; // Fail secure
  }
}

/**
 * Check if user has required subscription tier
 * 
 * @param userId - User ID to check
 * @param requiredTier - Required tier level
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise<boolean> - True if user meets tier requirement
 */
export async function hasRequiredTier(
  userId: string,
  requiredTier: 'PRIVILEGED' | 'PRIVILEGED_PLUS',
  useCache: boolean = true
): Promise<boolean> {
  try {
    const status = await getSubscriptionStatus(userId, { useCache });
    
    if (!status.hasActiveSubscription) {
      return false;
    }

    if (requiredTier === 'PRIVILEGED') {
      return status.currentTier === 'PRIVILEGED' || status.currentTier === 'PRIVILEGED_PLUS';
    }
    
    if (requiredTier === 'PRIVILEGED_PLUS') {
      return status.currentTier === 'PRIVILEGED_PLUS';
    }
    
    return false;
  } catch (error) {
    console.error('[Subscription API] Error checking required tier:', error);
    return false; // Fail secure
  }
}

/**
 * Check if subscription is valid and not expired
 * 
 * @param userId - User ID to check
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise<boolean> - True if subscription is valid
 */
export async function isSubscriptionValid(
  userId: string,
  useCache: boolean = true
): Promise<boolean> {
  try {
    const status = await getSubscriptionStatus(userId, { useCache });
    return status.isValid;
  } catch (error) {
    console.error('[Subscription API] Error checking subscription validity:', error);
    return false; // Fail secure
  }
}

// =========================
// Backward Compatibility Layer
// =========================

/**
 * Legacy function names for backward compatibility
 * These maintain the existing API while using the new secure implementation
 */

/**
 * @deprecated Use getSubscriptionStatus instead
 */
export const validateSubscription = getSubscriptionStatus;

/**
 * @deprecated Use checkActiveSubscription instead
 */
export const hasValidSubscription = checkActiveSubscription;

/**
 * @deprecated Use getSubscriptionTier instead
 */
export const getUserTier = getSubscriptionTier;

// =========================
// Utility Functions
// =========================

/**
 * Get subscription expiry date
 * 
 * @param userId - User ID to check
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise<Date | null> - Subscription expiry date or null
 */
export async function getSubscriptionExpiry(
  userId: string,
  useCache: boolean = true
): Promise<Date | null> {
  try {
    const status = await getSubscriptionStatus(userId, { useCache });
    return status.subscriptionExpiry ? new Date(status.subscriptionExpiry) : null;
  } catch (error) {
    console.error('[Subscription API] Error getting subscription expiry:', error);
    return null;
  }
}

/**
 * Get days until subscription expires
 * 
 * @param userId - User ID to check
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise<number | null> - Days until expiry or null if no expiry
 */
export async function getDaysUntilExpiry(
  userId: string,
  useCache: boolean = true
): Promise<number | null> {
  try {
    const expiry = await getSubscriptionExpiry(userId, useCache);
    if (!expiry) return null;
    
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('[Subscription API] Error calculating days until expiry:', error);
    return null;
  }
}

/**
 * Check if subscription expires soon (within specified days)
 * 
 * @param userId - User ID to check
 * @param withinDays - Number of days to check (default: 7)
 * @param useCache - Whether to use cache (default: true)
 * @returns Promise<boolean> - True if subscription expires soon
 */
export async function isSubscriptionExpiringSoon(
  userId: string,
  withinDays: number = 7,
  useCache: boolean = true
): Promise<boolean> {
  try {
    const daysUntilExpiry = await getDaysUntilExpiry(userId, useCache);
    if (daysUntilExpiry === null) return false;
    
    return daysUntilExpiry <= withinDays && daysUntilExpiry > 0;
  } catch (error) {
    console.error('[Subscription API] Error checking expiry warning:', error);
    return false;
  }
}

// =========================
// Performance Monitoring
// =========================

/**
 * Get API performance metrics
 */
export function getAPIPerformanceMetrics() {
  try {
    const cacheStats = require('./cache').getCacheStats();
    
    return {
      cache: cacheStats,
      recommendations: {
        cacheHitRate: cacheStats.hitRate > 0.8 ? 'Good' : 'Consider cache warming',
        averageResponseTime: cacheStats.averageResponseTime < 100 ? 'Excellent' : 'Monitor performance',
      },
    };
  } catch (error) {
    console.error('[Subscription API] Error getting performance metrics:', error);
    return null;
  }
}

// =========================
// Development Utilities
// =========================

/**
 * Development helper to test subscription system
 * Only available in development mode
 */
export async function testSubscriptionSystem(userId: string) {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('testSubscriptionSystem is only available in development mode');
    return;
  }

  console.log('🧪 Testing Subscription System for user:', userId);
  
  try {
    // Test direct validation
    console.log('1. Testing direct validation...');
    const directResult = await getSubscriptionStatus(userId, { useCache: false });
    console.log('Direct result:', directResult);
    
    // Test cached validation
    console.log('2. Testing cached validation...');
    const cachedResult = await getSubscriptionStatus(userId, { useCache: true });
    console.log('Cached result:', cachedResult);
    
    // Test utility functions
    console.log('3. Testing utility functions...');
    const hasActive = await checkActiveSubscription(userId);
    const tier = await getSubscriptionTier(userId);
    const isValid = await isSubscriptionValid(userId);
    const expiry = await getSubscriptionExpiry(userId);
    
    console.log('Utility results:', {
      hasActive,
      tier,
      isValid,
      expiry,
    });
    
    // Test performance
    console.log('4. Testing performance...');
    const metrics = getAPIPerformanceMetrics();
    console.log('Performance metrics:', metrics);
    
    console.log('✅ Subscription system test completed');
    
  } catch (error) {
    console.error('❌ Subscription system test failed:', error);
  }
}

// =========================
// Integration Helpers for Existing Code
// =========================

/**
 * Helper function to integrate with existing entitlements system
 * This replaces the vulnerable membership tier logic in membership.ts
 *
 * @param userId - User ID to get secure membership tier for
 * @returns Promise<string> - Validated membership tier
 */
export async function getSecureMembershipTier(userId: string): Promise<string> {
  try {
    console.log(`[Secure Integration] Getting validated membership tier for user: ${userId}`);

    const status = await getSubscriptionStatus(userId, { useCache: true });

    // Log the validation result for debugging
    console.log(`[Secure Integration] Subscription status for user ${userId}:`, {
      hasActiveSubscription: status.hasActiveSubscription,
      currentTier: status.currentTier,
      isValid: status.isValid,
      validationSource: status.validationSource,
    });

    return status.currentTier;
  } catch (error) {
    console.error('[Secure Integration] Error getting secure membership tier:', error);
    return 'MEMBER'; // Fail secure
  }
}

/**
 * Helper function to check if user has privileged access
 * This replaces direct membership_tier checks throughout the codebase
 *
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user has privileged access
 */
export async function hasPrivilegedAccess(userId: string): Promise<boolean> {
  try {
    const tier = await getSecureMembershipTier(userId);
    return tier === 'PRIVILEGED' || tier === 'PRIVILEGED_PLUS';
  } catch (error) {
    console.error('[Secure Integration] Error checking privileged access:', error);
    return false; // Fail secure
  }
}

/**
 * Helper function to check if user has privileged plus access
 * This replaces direct membership_tier checks throughout the codebase
 *
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user has privileged plus access
 */
export async function hasPrivilegedPlusAccess(userId: string): Promise<boolean> {
  try {
    const tier = await getSecureMembershipTier(userId);
    return tier === 'PRIVILEGED_PLUS';
  } catch (error) {
    console.error('[Secure Integration] Error checking privileged plus access:', error);
    return false; // Fail secure
  }
}

/**
 * Migration helper: Validates that cached membership_tier matches subscription status
 * This can be used to identify users with stale cached data
 *
 * @param userId - User ID to validate
 * @returns Promise<{isConsistent: boolean, cachedTier: string, validatedTier: string}>
 */
export async function validateMembershipConsistency(userId: string): Promise<{
  isConsistent: boolean;
  cachedTier: string;
  validatedTier: string;
  needsUpdate: boolean;
}> {
  try {
    // Get cached tier from database
    const { supabase } = await import('@/lib/supabase');
    const { data: user, error } = await supabase
      .from('users')
      .select('membership_tier')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const cachedTier = user?.membership_tier || 'MEMBER';

    // Get validated tier from subscription system
    const validatedTier = await getSecureMembershipTier(userId);

    const isConsistent = cachedTier === validatedTier;
    const needsUpdate = !isConsistent;

    if (!isConsistent) {
      console.warn(`[Consistency Check] Tier mismatch for user ${userId}: cached=${cachedTier}, validated=${validatedTier}`);
    }

    return {
      isConsistent,
      cachedTier,
      validatedTier,
      needsUpdate,
    };
  } catch (error) {
    console.error('[Consistency Check] Error validating membership consistency:', error);
    return {
      isConsistent: false,
      cachedTier: 'MEMBER',
      validatedTier: 'MEMBER',
      needsUpdate: false,
    };
  }
}

// =========================
// React Hook Integration Helpers
// =========================

/**
 * Data structure for React hooks
 */
export interface SubscriptionHookData {
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  currentTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
  isValid: boolean;
  expiresIn: number | null; // days until expiry
  refresh: () => Promise<void>;
}

/**
 * Helper function for React hooks to get subscription data
 * This can be used to create useSubscription hooks
 *
 * @param userId - User ID to get subscription data for
 * @returns Promise<SubscriptionHookData> - Data structure for React hooks
 */
export async function getSubscriptionHookData(userId: string): Promise<SubscriptionHookData> {
  try {
    const status = await getSubscriptionStatus(userId, { useCache: true });
    const expiresIn = await getDaysUntilExpiry(userId, true);

    return {
      subscriptionStatus: status,
      loading: false,
      error: null,
      hasActiveSubscription: status.hasActiveSubscription,
      currentTier: status.currentTier,
      isValid: status.isValid,
      expiresIn,
      refresh: async () => {
        // Invalidate cache and refresh
        const { invalidateUserCache } = await import('./cache');
        await invalidateUserCache(userId);
        await getSubscriptionStatus(userId, { forceRefresh: true });
      },
    };
  } catch (error) {
    console.error('[Hook Data] Error getting subscription hook data:', error);

    return {
      subscriptionStatus: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasActiveSubscription: false,
      currentTier: 'MEMBER',
      isValid: false,
      expiresIn: null,
      refresh: async () => {
        // Retry getting data
        await getSubscriptionHookData(userId);
      },
    };
  }
}
