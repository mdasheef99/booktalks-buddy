/**
 * Entitlements Management
 * 
 * This module handles user entitlements including fetching,
 * refreshing, and checking entitlements.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import { getUserEntitlements } from '@/lib/entitlements/cache';
import { hasEntitlement, hasContextualEntitlement } from '@/lib/entitlements';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

/**
 * Refresh entitlements for a user
 * 
 * @param user - Current user
 * @param setEntitlements - Entitlements state setter
 * @param setEntitlementsLoading - Loading state setter
 * @returns Promise<void>
 */
export async function refreshEntitlements(
  user: User | null,
  setEntitlements: (entitlements: string[]) => void,
  setEntitlementsLoading: (loading: boolean) => void
): Promise<void> {
  if (!user) {
    setEntitlements([]);
    setEntitlementsLoading(false);
    return;
  }

  try {
    setEntitlementsLoading(true);
    console.log(`[AuthContext] Refreshing entitlements for user ${user.id}`);

    // Force refresh entitlements - this will use subscription validation internally
    const userEntitlements = await getUserEntitlements(user.id, true);
    setEntitlements(userEntitlements);

    console.log(`[AuthContext] Entitlements updated: ${userEntitlements.length} entitlements loaded`);

  } catch (error) {
    console.error('[AuthContext] Error refreshing entitlements:', error);
    toast.error('Failed to load user permissions');
    setEntitlements([]);
  } finally {
    setEntitlementsLoading(false);
  }
}

/**
 * Load initial entitlements for a user
 * 
 * @param user - Current user
 * @param setEntitlements - Entitlements state setter
 * @param setEntitlementsLoading - Loading state setter
 * @returns Promise<void>
 */
export async function loadInitialEntitlements(
  user: User | null,
  setEntitlements: (entitlements: string[]) => void,
  setEntitlementsLoading: (loading: boolean) => void
): Promise<void> {
  if (!user?.id) {
    setEntitlements([]);
    setEntitlementsLoading(false);
    return;
  }

  try {
    setEntitlementsLoading(true);

    // Use the cached entitlements if available
    const userEntitlements = await getUserEntitlements(user.id);
    setEntitlements(userEntitlements);
  } catch (error) {
    setEntitlements([]);
  } finally {
    setEntitlementsLoading(false);
  }
}

/**
 * Check if user has a specific entitlement
 * 
 * @param entitlements - Current entitlements
 * @param entitlement - Entitlement to check
 * @returns boolean - True if user has entitlement
 */
export function checkEntitlement(entitlements: string[], entitlement: string): boolean {
  return hasEntitlement(entitlements, entitlement);
}

/**
 * Check if user has a contextual entitlement
 * 
 * @param entitlements - Current entitlements
 * @param prefix - Entitlement prefix
 * @param contextId - Context ID
 * @returns boolean - True if user has contextual entitlement
 */
export function checkContextualEntitlement(
  entitlements: string[], 
  prefix: string, 
  contextId: string
): boolean {
  return hasContextualEntitlement(entitlements, prefix, contextId);
}
