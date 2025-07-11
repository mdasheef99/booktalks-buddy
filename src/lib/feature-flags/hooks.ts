/**
 * Feature Flag React Hooks
 * 
 * React hooks for easy feature flag integration in components.
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { 
  isFeatureEnabled, 
  checkMultipleFeatureFlags,
  getSubscriptionFeatureFlags,
  clearUserFeatureFlagCache,
  type FeatureFlagKey, 
  type FeatureFlagContext,
  type FeatureFlagResult 
} from './index';

// =========================
// Hook Types
// =========================

export interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseMultipleFeatureFlagsResult {
  flags: Map<FeatureFlagKey, boolean>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseSubscriptionFeatureFlagsResult {
  validationEnabled: boolean;
  cacheInvalidationEnabled: boolean;
  monitoringEnabled: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// =========================
// Core Hooks
// =========================

/**
 * Hook to check a single feature flag
 * 
 * @param flagKey - Feature flag key to check
 * @param context - Optional context override (uses auth context by default)
 * @returns UseFeatureFlagResult
 */
export function useFeatureFlag(
  flagKey: FeatureFlagKey,
  context?: FeatureFlagContext
): UseFeatureFlagResult {
  const authContext = useContext(AuthContext);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Build context from auth if not provided
  const effectiveContext: FeatureFlagContext = context || {
    userId: authContext?.user?.id,
    storeId: authContext?.user?.store_id
  };

  const checkFlag = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await isFeatureEnabled(flagKey, effectiveContext);
      setEnabled(result.enabled);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setEnabled(false); // Safe default
      console.error(`Feature flag hook error for ${flagKey}:`, err);
    } finally {
      setLoading(false);
    }
  }, [flagKey, effectiveContext.userId, effectiveContext.storeId]);

  // Initial check and refresh function
  const refresh = useCallback(async () => {
    await checkFlag();
  }, [checkFlag]);

  // Check flag on mount and when dependencies change
  useEffect(() => {
    checkFlag();
  }, [checkFlag]);

  return {
    enabled,
    loading,
    error,
    refresh
  };
}

/**
 * Hook to check multiple feature flags
 * 
 * @param flagKeys - Array of feature flag keys to check
 * @param context - Optional context override (uses auth context by default)
 * @returns UseMultipleFeatureFlagsResult
 */
export function useMultipleFeatureFlags(
  flagKeys: FeatureFlagKey[],
  context?: FeatureFlagContext
): UseMultipleFeatureFlagsResult {
  const authContext = useContext(AuthContext);
  const [flags, setFlags] = useState<Map<FeatureFlagKey, boolean>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Build context from auth if not provided
  const effectiveContext: FeatureFlagContext = context || {
    userId: authContext?.user?.id,
    storeId: authContext?.user?.store_id
  };

  const checkFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await checkMultipleFeatureFlags(flagKeys, effectiveContext);
      setFlags(results);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setFlags(new Map()); // Safe default
      console.error('Multiple feature flags hook error:', err);
    } finally {
      setLoading(false);
    }
  }, [flagKeys, effectiveContext.userId, effectiveContext.storeId]);

  // Initial check and refresh function
  const refresh = useCallback(async () => {
    await checkFlags();
  }, [checkFlags]);

  // Check flags on mount and when dependencies change
  useEffect(() => {
    checkFlags();
  }, [checkFlags]);

  return {
    flags,
    loading,
    error,
    refresh
  };
}

// =========================
// Subscription-Specific Hooks
// =========================

/**
 * Hook to check all subscription-related feature flags
 * 
 * @param context - Optional context override (uses auth context by default)
 * @returns UseSubscriptionFeatureFlagsResult
 */
export function useSubscriptionFeatureFlags(
  context?: FeatureFlagContext
): UseSubscriptionFeatureFlagsResult {
  const authContext = useContext(AuthContext);
  const [validationEnabled, setValidationEnabled] = useState<boolean>(false);
  const [cacheInvalidationEnabled, setCacheInvalidationEnabled] = useState<boolean>(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Build context from auth if not provided
  const effectiveContext: FeatureFlagContext = context || {
    userId: authContext?.user?.id,
    storeId: authContext?.user?.store_id
  };

  const checkSubscriptionFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const flags = await getSubscriptionFeatureFlags(effectiveContext);
      
      setValidationEnabled(flags.validationEnabled);
      setCacheInvalidationEnabled(flags.cacheInvalidationEnabled);
      setMonitoringEnabled(flags.monitoringEnabled);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Safe defaults
      setValidationEnabled(false);
      setCacheInvalidationEnabled(false);
      setMonitoringEnabled(false);
      
      console.error('Subscription feature flags hook error:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveContext.userId, effectiveContext.storeId]);

  // Initial check and refresh function
  const refresh = useCallback(async () => {
    await checkSubscriptionFlags();
  }, [checkSubscriptionFlags]);

  // Check flags on mount and when dependencies change
  useEffect(() => {
    checkSubscriptionFlags();
  }, [checkSubscriptionFlags]);

  return {
    validationEnabled,
    cacheInvalidationEnabled,
    monitoringEnabled,
    loading,
    error,
    refresh
  };
}

// =========================
// Utility Hooks
// =========================

/**
 * Hook to clear feature flag cache when user context changes
 * 
 * @param userId - User ID to clear cache for
 */
export function useClearFeatureFlagCache(userId?: string) {
  const clearCache = useCallback(() => {
    if (userId) {
      clearUserFeatureFlagCache(userId);
    }
  }, [userId]);

  return clearCache;
}

/**
 * Hook that provides a simple boolean for subscription validation feature
 * This is the most commonly used hook for the security fix
 * 
 * @returns boolean indicating if subscription validation is enabled
 */
export function useSubscriptionValidation(): boolean {
  const { validationEnabled } = useSubscriptionFeatureFlags();
  return validationEnabled;
}

/**
 * Hook that provides subscription validation state with loading
 * Useful when you need to show loading states
 * 
 * @returns Object with enabled state and loading indicator
 */
export function useSubscriptionValidationWithLoading(): {
  enabled: boolean;
  loading: boolean;
} {
  const { validationEnabled, loading } = useSubscriptionFeatureFlags();
  return {
    enabled: validationEnabled,
    loading
  };
}
