/**
 * Entitlements Hooks
 *
 * This module provides React hooks for using entitlements in components.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserEntitlements } from './cache';
import {
  hasEntitlement,
  hasContextualEntitlement,
  canManageClub,
  canModerateClub,
  canManageStore,
  canManageUserTiers,
  isPlatformOwner
} from './index';

/**
 * Hook to get all entitlements for the current user
 *
 * @returns An object containing the entitlements array, loading state, and refresh function
 */
export function useEntitlements() {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<'hit' | 'miss' | 'error' | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEntitlements() {
      if (!user) {
        setEntitlements([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Track the start time for performance monitoring
        const startTime = performance.now();

        // Get entitlements from cache or calculate them
        const userEntitlements = await getUserEntitlements(user.id);

        // Calculate the time it took to get entitlements
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Only update state if the component is still mounted
        if (isMounted) {
          setEntitlements(userEntitlements);

          // Determine if this was a cache hit or miss
          // This is a simplified approach - in a real implementation,
          // you might want to pass this information from the cache function
          if (duration < 50) { // Arbitrary threshold to guess if it was a cache hit
            setCacheStatus('hit');
          } else {
            setCacheStatus('miss');
          }
        }
      } catch (error) {
        console.error('Error loading entitlements:', error);
        if (isMounted) {
          setEntitlements([]);
          setCacheStatus('error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEntitlements();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user]);

  const refreshEntitlements = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setCacheStatus(null);

      // Force refresh by passing true as the second argument
      const userEntitlements = await getUserEntitlements(user.id, true);

      setEntitlements(userEntitlements);
      setCacheStatus('miss'); // It's always a miss when forcing refresh
    } catch (error) {
      console.error('Error refreshing entitlements:', error);
      setCacheStatus('error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    entitlements,
    loading,
    refreshEntitlements,
    cacheStatus
  };
}

/**
 * Hook to check if the current user has a specific entitlement
 *
 * @param entitlement The entitlement to check for
 * @returns An object containing the result and loading state
 */
export function useHasEntitlement(entitlement: string) {
  const { entitlements, loading } = useEntitlements();
  const result = hasEntitlement(entitlements, entitlement);

  return { result, loading };
}

/**
 * Hook to check if the current user has a contextual entitlement
 *
 * @param prefix The entitlement prefix (e.g., 'CLUB_LEAD')
 * @param contextId The context ID (e.g., the club ID)
 * @returns An object containing the result and loading state
 */
export function useHasContextualEntitlement(prefix: string, contextId: string) {
  const { entitlements, loading } = useEntitlements();
  const result = hasContextualEntitlement(entitlements, prefix, contextId);

  return { result, loading };
}

/**
 * Hook to check if the current user can manage a club
 *
 * @param clubId The club ID
 * @param storeId The store ID that the club belongs to
 * @returns An object containing the result and loading state
 */
export function useCanManageClub(clubId: string, storeId: string) {
  const { entitlements, loading } = useEntitlements();
  const result = canManageClub(entitlements, clubId, storeId);

  return { result, loading };
}

/**
 * Hook to check if the current user can moderate a club
 *
 * @param clubId The club ID
 * @param storeId The store ID that the club belongs to
 * @returns An object containing the result and loading state
 */
export function useCanModerateClub(clubId: string, storeId: string) {
  const { entitlements, loading } = useEntitlements();
  const result = canModerateClub(entitlements, clubId, storeId);

  return { result, loading };
}

/**
 * Hook to check if the current user can manage a store
 *
 * @param storeId The store ID
 * @returns An object containing the result and loading state
 */
export function useCanManageStore(storeId: string) {
  const { entitlements, loading } = useEntitlements();
  const result = canManageStore(entitlements, storeId);

  return { result, loading };
}

/**
 * Hook to check if the current user can manage user tiers
 *
 * @param storeId The store ID
 * @returns An object containing the result and loading state
 */
export function useCanManageUserTiers(storeId: string) {
  const { entitlements, loading } = useEntitlements();
  const result = canManageUserTiers(entitlements, storeId);

  // Debug logging for useCanManageUserTiers
  React.useEffect(() => {
    console.log('🔐 useCanManageUserTiers Debug Info:');
    console.log('  storeId:', storeId);
    console.log('  entitlements:', entitlements);
    console.log('  loading:', loading);
    console.log('  result:', result);

    // Check specific entitlements
    const hasUserTiersEntitlement = entitlements.includes('CAN_MANAGE_USER_TIERS');
    const hasStoreOwnerEntitlement = entitlements.includes(`STORE_OWNER_${storeId}`);
    const hasStoreManagerEntitlement = entitlements.includes(`STORE_MANAGER_${storeId}`);
    const hasManageAllStoresEntitlement = entitlements.includes('CAN_MANAGE_ALL_STORES');
    const hasPlatformSettingsEntitlement = entitlements.includes('CAN_MANAGE_PLATFORM_SETTINGS');

    console.log('  hasUserTiersEntitlement:', hasUserTiersEntitlement);
    console.log('  hasStoreOwnerEntitlement:', hasStoreOwnerEntitlement);
    console.log('  hasStoreManagerEntitlement:', hasStoreManagerEntitlement);
    console.log('  hasManageAllStoresEntitlement:', hasManageAllStoresEntitlement);
    console.log('  hasPlatformSettingsEntitlement:', hasPlatformSettingsEntitlement);
  }, [entitlements, loading, result, storeId]);

  return { result, loading };
}

/**
 * Hook to get the user's role in a store
 *
 * @param storeId The store ID
 * @returns The user's role in the store ('owner', 'manager', or null)
 */
export function useStoreRole(storeId: string) {
  const { entitlements, loading } = useEntitlements();

  const isOwner = hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId);
  const isManager = hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId);

  let role: 'owner' | 'manager' | null = null;
  if (isOwner) role = 'owner';
  else if (isManager) role = 'manager';

  return { role, loading };
}

/**
 * Hook to get the user's role in a club
 *
 * @param clubId The club ID
 * @returns The user's role in the club ('lead', 'moderator', or null)
 */
export function useClubRole(clubId: string) {
  const { entitlements, loading } = useEntitlements();

  const isLead = hasContextualEntitlement(entitlements, 'CLUB_LEAD', clubId);
  const isModerator = hasContextualEntitlement(entitlements, 'CLUB_MODERATOR', clubId);

  let role: 'lead' | 'moderator' | null = null;
  if (isLead) role = 'lead';
  else if (isModerator) role = 'moderator';

  return { role, loading };
}

/**
 * Hook to check if the current user is the platform owner
 *
 * @returns An object containing the result and loading state
 */
export function useIsPlatformOwner() {
  const { entitlements, loading } = useEntitlements();
  const result = isPlatformOwner(entitlements);

  return { result, loading };
}
