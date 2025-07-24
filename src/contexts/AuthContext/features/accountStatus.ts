/**
 * Account Status Feature Module
 * 
 * This module handles account status management within the AuthContext system,
 * following the same patterns as subscriptions and entitlements.
 * 
 * Part of: Suspension Enforcement System Implementation
 * Created: 2025-01-23
 */

import type { User } from '@supabase/supabase-js';
import { getUserAccountStatus, type AccountStatus } from '@/lib/api/admin/accountManagement';
import { supabase } from '@/lib/supabase';

// =========================
// Types and Interfaces
// =========================

/**
 * Account status loading state
 */
export interface AccountStatusState {
  accountStatus: AccountStatus | null;
  accountStatusLoading: boolean;
  lastChecked: string | null;
}

/**
 * Account status check result
 */
export interface AccountStatusCheck {
  isValid: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  message: string;
  shouldLogout: boolean;
}

// =========================
// Core Functions
// =========================

/**
 * Load account status for a user
 * 
 * @param user - Current user
 * @param setAccountStatus - Account status setter
 * @param setAccountStatusLoading - Loading state setter
 * @returns Promise<void>
 */
export async function loadAccountStatus(
  user: User | null,
  setAccountStatus: (status: AccountStatus | null) => void,
  setAccountStatusLoading: (loading: boolean) => void
): Promise<void> {
  if (!user?.id) {
    setAccountStatus(null);
    setAccountStatusLoading(false);
    return;
  }

  console.log(`[AccountStatus] Loading account status for user ${user.id}`);
  setAccountStatusLoading(true);

  try {
    const status = await getUserAccountStatus(user.id);
    setAccountStatus(status);
    console.log(`[AccountStatus] Loaded status:`, status);
  } catch (error) {
    console.error('[AccountStatus] Error loading account status:', error);
    // On error, assume active status to avoid blocking legitimate users
    setAccountStatus({ account_status: 'active' });
  } finally {
    setAccountStatusLoading(false);
  }
}

/**
 * Refresh account status for current user
 * 
 * @param user - Current user
 * @param setAccountStatus - Account status setter
 * @param setAccountStatusLoading - Loading state setter
 * @returns Promise<void>
 */
export async function refreshAccountStatus(
  user: User | null,
  setAccountStatus: (status: AccountStatus | null) => void,
  setAccountStatusLoading: (loading: boolean) => void
): Promise<void> {
  console.log('[AccountStatus] Refreshing account status');
  await loadAccountStatus(user, setAccountStatus, setAccountStatusLoading);
}

// =========================
// Status Check Functions
// =========================

/**
 * Check if account is suspended
 * 
 * @param accountStatus - Current account status
 * @returns boolean
 */
export function isAccountSuspended(accountStatus: AccountStatus | null): boolean {
  return accountStatus?.account_status === 'suspended';
}

/**
 * Check if account is deleted
 * 
 * @param accountStatus - Current account status
 * @returns boolean
 */
export function isAccountDeleted(accountStatus: AccountStatus | null): boolean {
  return accountStatus?.account_status === 'deleted';
}

/**
 * Check if account is active
 *
 * @param accountStatus - Current account status
 * @returns boolean
 */
export function isAccountActive(accountStatus: AccountStatus | null): boolean {
  // Treat null status as active for backward compatibility
  return !accountStatus?.account_status || accountStatus.account_status === 'active';
}

/**
 * Check if account is permanently suspended (expires_at is null)
 *
 * @param userId - User ID to check
 * @returns Promise<boolean>
 */
export async function isAccountPermanentlySuspended(userId: string): Promise<boolean> {
  try {
    // Query the moderation_actions table for active user suspensions
    const { data, error } = await supabase
      .from('moderation_actions')
      .select('expires_at')
      .eq('target_id', userId)
      .eq('action_type', 'user_suspension')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[AccountStatus] Error checking permanent suspension:', error);
      return false;
    }

    // If there's an active suspension and expires_at is null, it's permanent
    if (data && data.length > 0) {
      return data[0].expires_at === null;
    }

    return false;
  } catch (error) {
    console.error('[AccountStatus] Error in isAccountPermanentlySuspended:', error);
    return false;
  }
}

/**
 * Comprehensive account status validation
 * 
 * @param accountStatus - Current account status
 * @returns AccountStatusCheck
 */
export function validateAccountStatus(accountStatus: AccountStatus | null): AccountStatusCheck {
  const isSuspended = isAccountSuspended(accountStatus);
  const isDeleted = isAccountDeleted(accountStatus);
  const isActive = isAccountActive(accountStatus);

  // Determine if user should be logged out
  const shouldLogout = isSuspended || isDeleted;

  // Generate appropriate message
  let message = '';
  if (isSuspended) {
    message = 'Your account has been suspended. Please contact support for more information.';
  } else if (isDeleted) {
    message = 'Your account has been deleted and is no longer accessible.';
  } else if (isActive) {
    message = 'Account is active and in good standing.';
  } else {
    message = 'Account status could not be determined.';
  }

  return {
    isValid: isActive,
    isSuspended,
    isDeleted,
    message,
    shouldLogout
  };
}

// =========================
// Helper Functions
// =========================

/**
 * Get user-friendly account status message with permanent suspension detection
 *
 * @param accountStatus - Current account status
 * @param userId - User ID to check for permanent suspension (optional)
 * @returns string
 */
export async function getAccountStatusMessage(
  accountStatus: AccountStatus | null,
  userId?: string
): Promise<string> {
  const validation = validateAccountStatus(accountStatus);

  // For suspended users, check if it's permanent or temporary
  if (validation.isSuspended && userId) {
    try {
      const isPermanent = await isAccountPermanentlySuspended(userId);
      if (isPermanent) {
        return 'Your account has been permanently suspended. Please contact support for more information.';
      } else {
        return 'Your account has been temporarily suspended. Please contact support for more information.';
      }
    } catch (error) {
      console.error('[AccountStatus] Error checking permanent suspension status:', error);
      // Fallback to generic message
    }
  }

  return validation.message;
}

/**
 * Get user-friendly account status message (synchronous version for backward compatibility)
 *
 * @param accountStatus - Current account status
 * @returns string
 */
export function getAccountStatusMessageSync(accountStatus: AccountStatus | null): string {
  const validation = validateAccountStatus(accountStatus);
  return validation.message;
}

/**
 * Get account status display name with permanent suspension detection
 *
 * @param accountStatus - Current account status
 * @param userId - User ID to check for permanent suspension (optional)
 * @returns Promise<string>
 */
export async function getAccountStatusDisplayName(
  accountStatus: AccountStatus | null,
  userId?: string
): Promise<string> {
  if (!accountStatus?.account_status) return 'Active';

  switch (accountStatus.account_status) {
    case 'active':
      return 'Active';
    case 'suspended':
      // Check if it's permanent suspension
      if (userId) {
        try {
          const isPermanent = await isAccountPermanentlySuspended(userId);
          return isPermanent ? 'Suspended Indefinitely' : 'Suspended';
        } catch (error) {
          console.error('[AccountStatus] Error checking permanent suspension status:', error);
        }
      }
      return 'Suspended';
    case 'deleted':
      return 'Deleted';
    default:
      return 'Unknown';
  }
}

/**
 * Get account status display name (synchronous version for backward compatibility)
 *
 * @param accountStatus - Current account status
 * @returns string
 */
export function getAccountStatusDisplayNameSync(accountStatus: AccountStatus | null): string {
  if (!accountStatus?.account_status) return 'Active';

  switch (accountStatus.account_status) {
    case 'active':
      return 'Active';
    case 'suspended':
      return 'Suspended';
    case 'deleted':
      return 'Deleted';
    default:
      return 'Unknown';
  }
}

/**
 * Format status change timestamp
 * 
 * @param accountStatus - Current account status
 * @returns string | null
 */
export function getStatusChangeTimestamp(accountStatus: AccountStatus | null): string | null {
  if (!accountStatus?.status_changed_at) return null;
  
  try {
    const date = new Date(accountStatus.status_changed_at);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  } catch (error) {
    console.error('[AccountStatus] Error formatting timestamp:', error);
    return null;
  }
}

// =========================
// Cache Management
// =========================

/**
 * Simple in-memory cache for account status
 * Prevents excessive database queries
 */
const accountStatusCache = new Map<string, {
  status: AccountStatus;
  timestamp: number;
  ttl: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached account status if available and not expired
 * 
 * @param userId - User ID
 * @returns AccountStatus | null
 */
export function getCachedAccountStatus(userId: string): AccountStatus | null {
  const cached = accountStatusCache.get(userId);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    accountStatusCache.delete(userId);
    return null;
  }
  
  return cached.status;
}

/**
 * Cache account status for user
 * 
 * @param userId - User ID
 * @param status - Account status to cache
 */
export function cacheAccountStatus(userId: string, status: AccountStatus): void {
  accountStatusCache.set(userId, {
    status,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  });
}

/**
 * Clear cached account status for user
 * 
 * @param userId - User ID
 */
export function clearCachedAccountStatus(userId: string): void {
  accountStatusCache.delete(userId);
}

/**
 * Clear all cached account statuses
 */
export function clearAllCachedAccountStatuses(): void {
  accountStatusCache.clear();
}
