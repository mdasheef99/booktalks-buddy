/**
 * Role Classification Constants
 * 
 * This module contains all constants used for role classification logic.
 * 
 * Part of: Role Classification System Refactoring
 * Created: 2025-01-11
 */

/**
 * Administrative roles that are exempt from subscription validation
 * These roles are critical for business operations and platform management
 */
export const ADMINISTRATIVE_EXEMPT_ROLES = [
  'PLATFORM_OWNER',
  'STORE_OWNER', 
  'STORE_MANAGER'
] as const;

/**
 * User roles that require active subscription validation
 * These roles provide premium features and should be subscription-gated
 */
export const USER_ENFORCED_ROLES = [
  'CLUB_LEADERSHIP',
  'CLUB_MODERATOR'
] as const;

/**
 * Helper functions for role type checking
 */

/**
 * Determines if a role type is administrative and exempt from subscription validation
 * 
 * @param roleType - The role type to check
 * @returns boolean - True if role is administrative and exempt
 */
export function isAdministrativeRole(roleType: string): boolean {
  return ADMINISTRATIVE_EXEMPT_ROLES.includes(roleType as any);
}

/**
 * Determines if a role type requires subscription validation
 * 
 * @param roleType - The role type to check  
 * @returns boolean - True if role requires subscription validation
 */
export function requiresSubscriptionValidation(roleType: string): boolean {
  return USER_ENFORCED_ROLES.includes(roleType as any);
}
