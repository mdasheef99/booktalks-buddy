/**
 * Entitlements Permissions
 *
 * This module contains core permission checking and role hierarchy logic.
 */

import { ROLE_HIERARCHY, getRoleEntitlements } from './constants';
import { UserRole } from './roles';
import { supabase } from '../supabase';

/**
 * Check if a user has a specific entitlement
 *
 * @param entitlements The user's entitlements array
 * @param entitlement The entitlement to check for
 * @returns True if the user has the entitlement, false otherwise
 */
export function hasEntitlement(entitlements: string[], entitlement: string): boolean {
  return entitlements.includes(entitlement);
}

/**
 * Check if a user has a contextual entitlement (e.g., CLUB_LEAD_123)
 *
 * @param entitlements The user's entitlements array
 * @param prefix The entitlement prefix (e.g., 'CLUB_LEAD')
 * @param contextId The context ID (e.g., the club ID)
 * @returns True if the user has the contextual entitlement, false otherwise
 */
export function hasContextualEntitlement(
  entitlements: string[],
  prefix: string,
  contextId: string
): boolean {
  return entitlements.includes(`${prefix}_${contextId}`);
}

/**
 * Check if a user can manage a club (as a lead, store admin, or moderator)
 *
 * @param entitlements The user's entitlements array
 * @param clubId The club ID
 * @param storeId The store ID that the club belongs to
 * @returns True if the user can manage the club, false otherwise
 */
export function canManageClub(
  entitlements: string[],
  clubId: string,
  storeId: string
): boolean {
  return (
    hasEntitlement(entitlements, 'CAN_MANAGE_ALL_CLUBS') ||
    hasContextualEntitlement(entitlements, 'CLUB_LEAD', clubId) ||
    hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
    hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId)
  );
}

/**
 * Check if a user can moderate a club (as a moderator, lead, or store admin)
 *
 * @param entitlements The user's entitlements array
 * @param clubId The club ID
 * @param storeId The store ID that the club belongs to
 * @returns True if the user can moderate the club, false otherwise
 */
export function canModerateClub(
  entitlements: string[],
  clubId: string,
  storeId: string
): boolean {
  return (
    canManageClub(entitlements, clubId, storeId) ||
    hasContextualEntitlement(entitlements, 'CLUB_MODERATOR', clubId)
  );
}

/**
 * Check if a user can manage store settings (as a store owner)
 *
 * @param entitlements The user's entitlements array
 * @param storeId The store ID
 * @returns True if the user can manage store settings, false otherwise
 */
export function canManageStore(
  entitlements: string[],
  storeId: string
): boolean {
  return (
    hasEntitlement(entitlements, 'CAN_MANAGE_STORE_SETTINGS') &&
    hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId)
  );
}

/**
 * Check if a user can manage user tiers (as a store owner or manager)
 *
 * @param entitlements The user's entitlements array
 * @param storeId The store ID
 * @returns True if the user can manage user tiers, false otherwise
 */
export function canManageUserTiers(
  entitlements: string[],
  storeId: string
): boolean {
  return (
    hasEntitlement(entitlements, 'CAN_MANAGE_USER_TIERS') && (
      hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
      hasContextualEntitlement(entitlements, 'STORE_MANAGER', storeId)
    )
  );
}

/**
 * Check if a user is the platform owner
 *
 * @param entitlements The user's entitlements array
 * @returns True if the user is the platform owner, false otherwise
 */
export function isPlatformOwner(entitlements: string[]): boolean {
  return hasEntitlement(entitlements, 'CAN_MANAGE_PLATFORM_SETTINGS');
}

/**
 * Enhanced permission checking with role hierarchy support
 *
 * @param entitlements The user's entitlements array
 * @param requiredEntitlement The entitlement to check for
 * @param contextId Optional context ID for contextual permissions
 * @param userRoles Optional array of user roles for hierarchy checking
 * @returns True if the user has the permission, false otherwise
 */
export function hasPermission(
  entitlements: string[],
  requiredEntitlement: string,
  contextId?: string,
  userRoles?: UserRole[]
): boolean {
  // Direct entitlement check
  if (entitlements.includes(requiredEntitlement)) return true;

  // Contextual entitlement check
  if (contextId && hasContextualEntitlement(entitlements, requiredEntitlement, contextId)) return true;

  // Role hierarchy check
  if (userRoles && userRoles.length > 0) {
    return hasPermissionThroughRoleHierarchy(userRoles, requiredEntitlement, contextId);
  }

  return false;
}

/**
 * Check permission through role hierarchy inheritance
 *
 * @param userRoles Array of user roles
 * @param requiredEntitlement The entitlement to check for
 * @param contextId Optional context ID for contextual permissions
 * @returns True if the user has the permission through role hierarchy
 */
export function hasPermissionThroughRoleHierarchy(
  userRoles: UserRole[],
  requiredEntitlement: string,
  contextId?: string
): boolean {
  // Sort roles by context priority: platform > store > club
  const sortedRoles = userRoles.sort((a, b) => {
    const priorityA = getContextPriority(a.contextType);
    const priorityB = getContextPriority(b.contextType);
    return priorityB - priorityA; // Higher priority first
  });

  for (const userRole of sortedRoles) {
    // Check if this role applies to the requested context
    if (contextId && userRole.contextId && userRole.contextId !== contextId) {
      // For store/club contexts, check if the role has broader scope
      if (!hasContextualAuthoritySync(userRole, contextId)) {
        continue;
      }
    }

    // Get inherited roles for this user role
    const inheritedRoles = ROLE_HIERARCHY[userRole.role] || [];

    // Check if any inherited role has the required entitlement
    for (const inheritedRole of inheritedRoles) {
      const roleEntitlements = getRoleEntitlements(inheritedRole);
      if (roleEntitlements.includes(requiredEntitlement)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Async version of permission checking through role hierarchy
 */
export async function hasPermissionThroughRoleHierarchyAsync(
  userRoles: UserRole[],
  requiredEntitlement: string,
  contextId?: string
): Promise<boolean> {
  // Sort roles by context priority: platform > store > club
  const sortedRoles = userRoles.sort((a, b) => {
    const priorityA = getContextPriority(a.contextType);
    const priorityB = getContextPriority(b.contextType);
    return priorityB - priorityA; // Higher priority first
  });

  for (const userRole of sortedRoles) {
    // Check if this role applies to the requested context
    if (contextId && userRole.contextId && userRole.contextId !== contextId) {
      // For store/club contexts, check if the role has broader scope
      const hasAuthority = await hasContextualAuthority(userRole, contextId);
      if (!hasAuthority) {
        continue;
      }
    }

    // Get inherited roles for this user role
    const inheritedRoles = ROLE_HIERARCHY[userRole.role] || [];

    // Check if any inherited role has the required entitlement
    for (const inheritedRole of inheritedRoles) {
      const roleEntitlements = getRoleEntitlements(inheritedRole);
      if (roleEntitlements.includes(requiredEntitlement)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get context priority for role hierarchy resolution
 */
function getContextPriority(contextType?: string): number {
  switch (contextType) {
    case 'platform': return 3;
    case 'store': return 2;
    case 'club': return 1;
    default: return 0;
  }
}

/**
 * Synchronous check if a role has authority over a specific context
 * Note: This is a simplified version that doesn't check store-club relationships
 */
function hasContextualAuthoritySync(userRole: UserRole, targetContextId: string): boolean {
  // Platform roles have authority over everything
  if (userRole.contextType === 'platform') {
    return true;
  }

  // For synchronous checking, we can only verify exact matches
  // Store-club relationship checking requires async database queries
  return userRole.contextId === targetContextId;
}

/**
 * Async check if a role has authority over a specific context
 */
async function hasContextualAuthority(userRole: UserRole, targetContextId: string): Promise<boolean> {
  // Platform roles have authority over everything
  if (userRole.contextType === 'platform') {
    return true;
  }

  // Store roles have authority over clubs within their store
  if (userRole.contextType === 'store' && userRole.contextId) {
    try {
      const { data: club } = await supabase
        .from('book_clubs')
        .select('store_id')
        .eq('id', targetContextId)
        .single();

      return club?.store_id === userRole.contextId;
    } catch (error) {
      console.error('Error checking contextual authority:', error);
      return false;
    }
  }

  // Club roles only have authority over their specific club
  return userRole.contextId === targetContextId;
}
