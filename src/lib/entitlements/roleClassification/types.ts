/**
 * Role Classification Type Definitions
 * 
 * This module contains all TypeScript interfaces and types used throughout
 * the role classification system.
 * 
 * Part of: Role Classification System Refactoring
 * Created: 2025-01-11
 */

/**
 * Complete role classification result for a user
 */
export interface RoleClassification {
  userId: string;
  administrativeRoles: AdministrativeRole[];
  userRoles: UserRole[];
  requiresSubscriptionValidation: boolean;
  exemptFromValidation: boolean;
  classificationReason: string;
}

/**
 * Administrative role that exempts user from subscription validation
 */
export interface AdministrativeRole {
  type: 'PLATFORM_OWNER' | 'STORE_OWNER' | 'STORE_MANAGER';
  storeId?: string;
  grantedAt: string;
  source: string;
}

/**
 * User role that requires subscription validation
 */
export interface UserRole {
  type: 'CLUB_LEADERSHIP' | 'CLUB_MODERATOR';
  clubId: string;
  grantedAt: string;
  requiresSubscription: boolean;
}

/**
 * Subscription validation decision result
 */
export interface SubscriptionValidationDecision {
  shouldValidate: boolean;
  reason: string;
  exemptRoles: AdministrativeRole[];
  enforcedRoles: UserRole[];
}

/**
 * Type definitions for role classification constants
 */
export type AdministrativeRoleType = 'PLATFORM_OWNER' | 'STORE_OWNER' | 'STORE_MANAGER';
export type UserRoleType = 'CLUB_LEADERSHIP' | 'CLUB_MODERATOR';
