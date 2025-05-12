/**
 * Entitlements Hooks
 *
 * This module provides React hooks for using entitlements in components.
 */

import { useState, useEffect, useCallback } from 'react';
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
 * @returns An object containing the entitlements array and loading state
 */
export function useEntitlements() {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntitlements() {
      if (!user) {
        setEntitlements([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userEntitlements = await getUserEntitlements(user.id);
        setEntitlements(userEntitlements);
      } catch (error) {
        console.error('Error loading entitlements:', error);
        setEntitlements([]);
      } finally {
        setLoading(false);
      }
    }

    loadEntitlements();
  }, [user]);

  const refreshEntitlements = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userEntitlements = await getUserEntitlements(user.id, true);
      setEntitlements(userEntitlements);
    } catch (error) {
      console.error('Error refreshing entitlements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { entitlements, loading, refreshEntitlements };
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
