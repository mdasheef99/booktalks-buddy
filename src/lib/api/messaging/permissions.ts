/**
 * Direct Messaging System - Permission Management
 * 
 * This file integrates with the existing entitlements system to provide
 * messaging-specific permission checking and tier-based access control.
 */

import { getUserEntitlements } from '@/lib/entitlements/cache';
import { hasEntitlement, hasContextualEntitlement } from '@/lib/entitlements/permissions';
import { MessageRetentionInfo, PermissionCheckResult } from './types';

// =========================
// Core Permission Checks
// =========================

/**
 * Check if user can initiate direct message conversations
 * Privileged and Privileged+ members can initiate conversations
 */
export async function canInitiateConversations(userId: string): Promise<boolean> {
  try {
    const entitlements = await getUserEntitlements(userId);
    
    return hasEntitlement(entitlements, 'CAN_SEND_DIRECT_MESSAGES') ||
           hasEntitlement(entitlements, 'CAN_INITIATE_DIRECT_MESSAGES');
  } catch (error) {
    console.error('Error checking conversation initiation permission:', error);
    return false;
  }
}

/**
 * Check if user can send messages (reply to existing conversations)
 * All authenticated users can reply to existing conversations
 */
export async function canSendMessages(userId: string): Promise<boolean> {
  // All authenticated users can reply to existing conversations
  // The actual permission is enforced by conversation participation
  return true;
}

/**
 * Check if user has administrative messaging privileges
 * Store Managers and Store Owners have admin privileges
 */
export async function hasAdminMessagingPrivileges(
  userId: string, 
  storeId: string
): Promise<boolean> {
  try {
    const entitlements = await getUserEntitlements(userId);
    
    return hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId) ||
           hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId);
  } catch (error) {
    console.error('Error checking admin messaging privileges:', error);
    return false;
  }
}

/**
 * Comprehensive permission check with detailed result
 */
export async function checkMessagingPermission(
  userId: string,
  action: 'initiate' | 'reply' | 'admin',
  storeId?: string
): Promise<PermissionCheckResult> {
  try {
    const entitlements = await getUserEntitlements(userId);

    switch (action) {
      case 'initiate':
        const canInitiate = hasEntitlement(entitlements, 'CAN_SEND_DIRECT_MESSAGES') ||
                           hasEntitlement(entitlements, 'CAN_INITIATE_DIRECT_MESSAGES');
        
        if (!canInitiate) {
          return {
            allowed: false,
            reason: 'Only Privileged and Privileged+ members can start new conversations',
            required_tier: 'Privileged'
          };
        }
        return { allowed: true };

      case 'reply':
        // All users can reply to existing conversations they're part of
        return { allowed: true };

      case 'admin':
        if (!storeId) {
          return {
            allowed: false,
            reason: 'Store context required for admin actions'
          };
        }

        const isAdmin = hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId) ||
                       hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId);

        if (!isAdmin) {
          return {
            allowed: false,
            reason: 'Store Manager or Store Owner privileges required',
            required_tier: 'Store Manager'
          };
        }
        return { allowed: true };

      default:
        return {
          allowed: false,
          reason: 'Unknown action type'
        };
    }
  } catch (error) {
    console.error('Error checking messaging permission:', error);
    return {
      allowed: false,
      reason: 'Error checking permissions'
    };
  }
}

// =========================
// Retention Policy Functions
// =========================

/**
 * Get user's message retention period based on tier
 * Returns retention info including tier, days, and expiration date
 */
export async function getUserRetentionPeriod(userId: string): Promise<MessageRetentionInfo> {
  try {
    const entitlements = await getUserEntitlements(userId);
    
    if (hasEntitlement(entitlements, 'CAN_SEND_DIRECT_MESSAGES')) {
      // Privileged Plus tier - 1 year retention
      return {
        tier: 'privileged_plus',
        retention_days: 365,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
    } else if (hasEntitlement(entitlements, 'CAN_INITIATE_DIRECT_MESSAGES')) {
      // Privileged tier - 180 days retention
      return {
        tier: 'privileged',
        retention_days: 180,
        expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
      };
    } else {
      // Free tier - 30 days retention
      return {
        tier: 'free',
        retention_days: 30,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
  } catch (error) {
    console.error('Error getting user retention period:', error);
    // Default to free tier on error
    return {
      tier: 'free',
      retention_days: 30,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

/**
 * Get retention days for database function compatibility
 */
export async function getUserRetentionDays(userId: string): Promise<number> {
  const retentionInfo = await getUserRetentionPeriod(userId);
  return retentionInfo.retention_days;
}

/**
 * Check if user's tier allows specific retention period
 */
export async function hasRetentionTier(
  userId: string, 
  requiredDays: number
): Promise<boolean> {
  const retentionInfo = await getUserRetentionPeriod(userId);
  return retentionInfo.retention_days >= requiredDays;
}

// =========================
// Tier Detection Functions
// =========================

/**
 * Get user's messaging tier for display purposes
 */
export async function getUserMessagingTier(userId: string): Promise<string> {
  try {
    const entitlements = await getUserEntitlements(userId);

    if (hasEntitlement(entitlements, 'CAN_SEND_DIRECT_MESSAGES')) {
      return 'Privileged Plus';
    } else if (hasEntitlement(entitlements, 'CAN_INITIATE_DIRECT_MESSAGES')) {
      return 'Privileged';
    } else {
      return 'Member';
    }
  } catch (error) {
    console.error('Error getting user messaging tier:', error);
    return 'Member';
  }
}

/**
 * Check if user can upgrade to enable messaging features
 */
export async function canUpgradeForMessaging(userId: string): Promise<{
  can_upgrade: boolean;
  current_tier: string;
  next_tier: string;
  benefits: string[];
}> {
  try {
    const entitlements = await getUserEntitlements(userId);
    
    if (hasEntitlement(entitlements, 'CAN_SEND_DIRECT_MESSAGES')) {
      // Already at highest tier
      return {
        can_upgrade: false,
        current_tier: 'Privileged Plus',
        next_tier: 'None',
        benefits: []
      };
    } else if (hasEntitlement(entitlements, 'CAN_INITIATE_DIRECT_MESSAGES')) {
      // Can upgrade to Privileged Plus
      return {
        can_upgrade: true,
        current_tier: 'Privileged',
        next_tier: 'Privileged Plus',
        benefits: [
          'Start conversations with any member',
          '1 year message history retention',
          'Priority customer support'
        ]
      };
    } else {
      // Can upgrade to Privileged
      return {
        can_upgrade: true,
        current_tier: 'Member',
        next_tier: 'Privileged',
        benefits: [
          'Start conversations with other members',
          '180 days message history retention',
          'Access to premium content'
        ]
      };
    }
  } catch (error) {
    console.error('Error checking upgrade options:', error);
    return {
      can_upgrade: false,
      current_tier: 'Unknown',
      next_tier: 'Unknown',
      benefits: []
    };
  }
}

// =========================
// Permission Validation Helpers
// =========================

/**
 * Validate and throw error if permission check fails
 */
export async function requireMessagingPermission(
  userId: string,
  action: 'initiate' | 'reply' | 'admin',
  storeId?: string
): Promise<void> {
  const result = await checkMessagingPermission(userId, action, storeId);
  
  if (!result.allowed) {
    const error = new Error(result.reason || 'Permission denied');
    (error as any).code = 'PERMISSION_DENIED';
    (error as any).details = {
      action,
      required_tier: result.required_tier,
      store_id: storeId
    };
    throw error;
  }
}

/**
 * Get permission summary for user (useful for UI)
 */
export async function getUserMessagingPermissions(userId: string, storeId?: string): Promise<{
  can_initiate: boolean;
  can_reply: boolean;
  can_admin: boolean;
  tier: string;
  retention_days: number;
  upgrade_available: boolean;
}> {
  try {
    const [
      canInitiate,
      canReply,
      canAdmin,
      tier,
      retentionInfo,
      upgradeInfo
    ] = await Promise.all([
      canInitiateConversations(userId),
      canSendMessages(userId),
      storeId ? hasAdminMessagingPrivileges(userId, storeId) : Promise.resolve(false),
      getUserMessagingTier(userId),
      getUserRetentionPeriod(userId),
      canUpgradeForMessaging(userId)
    ]);

    return {
      can_initiate: canInitiate,
      can_reply: canReply,
      can_admin: canAdmin,
      tier,
      retention_days: retentionInfo.retention_days,
      upgrade_available: upgradeInfo.can_upgrade
    };
  } catch (error) {
    console.error('Error getting user messaging permissions:', error);
    return {
      can_initiate: false,
      can_reply: true,
      can_admin: false,
      tier: 'Member',
      retention_days: 30,
      upgrade_available: true
    };
  }
}
