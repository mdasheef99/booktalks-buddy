/**
 * Feature Flag System
 * 
 * Frontend infrastructure for controlled rollout of subscription validation fixes.
 * Integrates with database is_feature_enabled() function for consistent flag evaluation.
 */

import { supabase } from '@/lib/supabase';

// =========================
// Feature Flag Constants
// =========================

/**
 * Subscription system feature flags
 */
export const SUBSCRIPTION_FEATURE_FLAGS = {
  /** Enable the fixed subscription validation that checks actual subscription expiry dates */
  SUBSCRIPTION_VALIDATION_FIX: 'subscription_validation_fix',

  /** Enable automatic cache invalidation when subscriptions expire */
  SUBSCRIPTION_CACHE_INVALIDATION: 'subscription_cache_invalidation',

  /** Enable enhanced subscription monitoring and metrics collection */
  SUBSCRIPTION_MONITORING: 'subscription_monitoring',

  /** Enable role-based subscription enforcement for user roles */
  ROLE_BASED_ENFORCEMENT: 'role_based_subscription_enforcement',
} as const;

/**
 * All available feature flags
 */
export const FEATURE_FLAGS = {
  ...SUBSCRIPTION_FEATURE_FLAGS,
} as const;

// =========================
// Types
// =========================

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

export interface FeatureFlagContext {
  userId?: string;
  storeId?: string;
}

export interface FeatureFlagResult {
  enabled: boolean;
  flagKey: string;
  context: FeatureFlagContext;
  checkedAt: Date;
}

export interface FeatureFlagCache {
  [key: string]: {
    result: FeatureFlagResult;
    expiresAt: number;
  };
}

// =========================
// Cache Management
// =========================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const flagCache: FeatureFlagCache = {};

/**
 * Generate cache key for feature flag
 */
function getCacheKey(flagKey: string, context: FeatureFlagContext): string {
  const { userId = 'anonymous', storeId = 'none' } = context;
  return `${flagKey}:${userId}:${storeId}`;
}

/**
 * Check if cached result is still valid
 */
function isCacheValid(cacheEntry: FeatureFlagCache[string]): boolean {
  return Date.now() < cacheEntry.expiresAt;
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache(): void {
  const now = Date.now();
  Object.keys(flagCache).forEach(key => {
    if (flagCache[key].expiresAt < now) {
      delete flagCache[key];
    }
  });
}

/**
 * Clear all cache entries for a specific user (useful when user context changes)
 */
export function clearUserFeatureFlagCache(userId: string): void {
  Object.keys(flagCache).forEach(key => {
    if (key.includes(`:${userId}:`)) {
      delete flagCache[key];
    }
  });
}

/**
 * Clear all feature flag cache
 */
export function clearAllFeatureFlagCache(): void {
  Object.keys(flagCache).forEach(key => {
    delete flagCache[key];
  });
}

// =========================
// Core Feature Flag Functions
// =========================

/**
 * Check if a feature flag is enabled for the current context
 * 
 * @param flagKey - Feature flag key
 * @param context - User and store context
 * @returns Promise<FeatureFlagResult>
 */
export async function isFeatureEnabled(
  flagKey: FeatureFlagKey,
  context: FeatureFlagContext = {}
): Promise<FeatureFlagResult> {
  const cacheKey = getCacheKey(flagKey, context);
  
  // Check cache first
  if (flagCache[cacheKey] && isCacheValid(flagCache[cacheKey])) {
    return flagCache[cacheKey].result;
  }
  
  // Clear expired cache entries periodically
  clearExpiredCache();
  
  try {
    // Call database function
    const { data, error } = await supabase.rpc('is_feature_enabled', {
      p_flag_key: flagKey,
      p_user_id: context.userId || null,
      p_store_id: context.storeId || null
    });
    
    if (error) {
      console.error(`Feature flag check failed for ${flagKey}:`, error);
      
      // Return safe default (disabled) on error
      const result: FeatureFlagResult = {
        enabled: false,
        flagKey,
        context,
        checkedAt: new Date()
      };
      
      return result;
    }
    
    const result: FeatureFlagResult = {
      enabled: Boolean(data),
      flagKey,
      context,
      checkedAt: new Date()
    };
    
    // Cache the result
    flagCache[cacheKey] = {
      result,
      expiresAt: Date.now() + CACHE_DURATION
    };
    
    return result;
    
  } catch (error) {
    console.error(`Feature flag check error for ${flagKey}:`, error);
    
    // Return safe default (disabled) on error
    return {
      enabled: false,
      flagKey,
      context,
      checkedAt: new Date()
    };
  }
}

/**
 * Check multiple feature flags at once
 * 
 * @param flagKeys - Array of feature flag keys
 * @param context - User and store context
 * @returns Promise<Map<FeatureFlagKey, boolean>>
 */
export async function checkMultipleFeatureFlags(
  flagKeys: FeatureFlagKey[],
  context: FeatureFlagContext = {}
): Promise<Map<FeatureFlagKey, boolean>> {
  const results = new Map<FeatureFlagKey, boolean>();
  
  // Check all flags in parallel
  const promises = flagKeys.map(async (flagKey) => {
    const result = await isFeatureEnabled(flagKey, context);
    return { flagKey, enabled: result.enabled };
  });
  
  const resolvedResults = await Promise.all(promises);
  
  resolvedResults.forEach(({ flagKey, enabled }) => {
    results.set(flagKey, enabled);
  });
  
  return results;
}

// =========================
// Subscription-Specific Helpers
// =========================

/**
 * Check if subscription validation fix is enabled
 */
export async function isSubscriptionValidationEnabled(
  context: FeatureFlagContext = {}
): Promise<boolean> {
  const result = await isFeatureEnabled(
    SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX,
    context
  );
  return result.enabled;
}

/**
 * Check if subscription cache invalidation is enabled
 */
export async function isSubscriptionCacheInvalidationEnabled(
  context: FeatureFlagContext = {}
): Promise<boolean> {
  const result = await isFeatureEnabled(
    SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_CACHE_INVALIDATION,
    context
  );
  return result.enabled;
}

/**
 * Check if subscription monitoring is enabled
 */
export async function isSubscriptionMonitoringEnabled(
  context: FeatureFlagContext = {}
): Promise<boolean> {
  const result = await isFeatureEnabled(
    SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_MONITORING,
    context
  );
  return result.enabled;
}

/**
 * Get all subscription feature flag states
 */
export async function getSubscriptionFeatureFlags(
  context: FeatureFlagContext = {}
): Promise<{
  validationEnabled: boolean;
  cacheInvalidationEnabled: boolean;
  monitoringEnabled: boolean;
}> {
  const flags = await checkMultipleFeatureFlags([
    SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX,
    SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_CACHE_INVALIDATION,
    SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_MONITORING
  ], context);
  
  return {
    validationEnabled: flags.get(SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX) || false,
    cacheInvalidationEnabled: flags.get(SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_CACHE_INVALIDATION) || false,
    monitoringEnabled: flags.get(SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_MONITORING) || false
  };
}

// =========================
// Development Helpers
// =========================

/**
 * Log feature flag status for debugging
 */
export async function debugFeatureFlags(
  context: FeatureFlagContext = {}
): Promise<void> {
  console.log('🏁 Feature Flag Debug Info');
  console.log('Context:', context);
  
  const subscriptionFlags = await getSubscriptionFeatureFlags(context);
  
  console.log('Subscription Feature Flags:');
  console.log(`  Validation Fix: ${subscriptionFlags.validationEnabled ? '✅' : '❌'}`);
  console.log(`  Cache Invalidation: ${subscriptionFlags.cacheInvalidationEnabled ? '✅' : '❌'}`);
  console.log(`  Monitoring: ${subscriptionFlags.monitoringEnabled ? '✅' : '❌'}`);
  
  console.log('Cache Status:');
  console.log(`  Cached entries: ${Object.keys(flagCache).length}`);
  console.log(`  Cache keys:`, Object.keys(flagCache));
}
