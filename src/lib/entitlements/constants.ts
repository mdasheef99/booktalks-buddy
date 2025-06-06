/**
 * Entitlements Constants
 *
 * This module contains all entitlement constants and role hierarchy definitions.
 */

/**
 * Basic entitlements that all authenticated users have (MEMBER tier)
 */
export const MEMBER_ENTITLEMENTS = [
  'CAN_VIEW_PUBLIC_CLUBS',
  'CAN_JOIN_LIMITED_CLUBS', // Up to 5 clubs
  'CAN_PARTICIPATE_IN_DISCUSSIONS',
  'CAN_EDIT_OWN_PROFILE',
  'CAN_VIEW_STORE_EVENTS',
];

// Backward compatibility
export const BASIC_ENTITLEMENTS = MEMBER_ENTITLEMENTS;

/**
 * Entitlements for privileged members
 */
export const PRIVILEGED_ENTITLEMENTS = [
  'CAN_CREATE_LIMITED_CLUBS', // Up to 3 clubs
  'CAN_JOIN_UNLIMITED_CLUBS',
  'CAN_NOMINATE_BOOKS',
  'CAN_CREATE_TOPICS',
  'CAN_ACCESS_PREMIUM_CONTENT',
  'CAN_JOIN_PREMIUM_CLUBS',
  'CAN_ACCESS_PREMIUM_EVENTS',
  'CAN_INITIATE_DIRECT_MESSAGES', // Can start conversations with other members
  ...MEMBER_ENTITLEMENTS
];

/**
 * Entitlements for privileged plus members
 */
export const PRIVILEGED_PLUS_ENTITLEMENTS = [
  'CAN_CREATE_UNLIMITED_CLUBS',
  'CAN_SEND_DIRECT_MESSAGES',
  'CAN_JOIN_EXCLUSIVE_CLUBS',
  'CAN_ACCESS_EXCLUSIVE_CONTENT',
  ...PRIVILEGED_ENTITLEMENTS
];

/**
 * Entitlements for club moderators
 */
export const CLUB_MODERATOR_ENTITLEMENTS = [
  'CAN_MODERATE_DISCUSSIONS',
  'CAN_LOCK_TOPICS',
  'CAN_DELETE_POSTS',
  'CAN_WARN_MEMBERS',
];

/**
 * Entitlements for club leads (inherits from moderators)
 */
export const CLUB_LEAD_ENTITLEMENTS = [
  'CAN_MANAGE_CLUB',
  'CAN_APPOINT_MODERATORS',
  'CAN_REMOVE_MODERATORS',
  'CAN_MANAGE_MEMBERS',
  'CAN_SET_CURRENT_BOOK',
  'CAN_MANAGE_CLUB_SETTINGS',
  'CAN_DELETE_OWN_CLUB',
  'CAN_MANAGE_CLUB_JOIN_REQUESTS',
  'CAN_REMOVE_CLUB_MEMBERS',
  'CAN_ASSIGN_CLUB_MODERATORS',
  'CAN_MANAGE_CLUB_EVENTS', // Club leads can create and manage events within their clubs
  ...CLUB_MODERATOR_ENTITLEMENTS
];

/**
 * Entitlements for store managers
 */
export const STORE_MANAGER_ENTITLEMENTS = [
  'CAN_VIEW_ALL_MEMBERS',
  'CAN_INVITE_USERS',
  'CAN_ISSUE_WARNINGS',
  'CAN_BAN_MEMBERS',
  'CAN_UNBAN_MEMBERS',
  'CAN_VIEW_ALL_CLUBS',
  'CAN_MODERATE_CONTENT',
  'CAN_MANAGE_EVENTS',
  'CAN_POST_ANNOUNCEMENTS',
  'CAN_MANAGE_MEMBER_TIERS',
  'CAN_MANAGE_USER_TIERS',
  'CAN_MANAGE_ALL_CLUBS',
  'CAN_MANAGE_STORE_EVENTS',
  'CAN_VIEW_STORE_ANALYTICS',
  'CAN_ASSIGN_CLUB_LEADS',
];

/**
 * Entitlements for store owners (inherits from managers)
 */
export const STORE_OWNER_ENTITLEMENTS = [
  'CAN_MANAGE_STORE',
  'CAN_CREATE_CLUBS',
  'CAN_DELETE_CLUBS',
  'CAN_ASSIGN_STORE_MANAGERS',
  'CAN_VIEW_STORE_ANALYTICS',
  'CAN_MANAGE_STORE_MANAGERS',
  'CAN_MANAGE_STORE_SETTINGS',
  'CAN_MANAGE_STORE_BILLING',
  ...STORE_MANAGER_ENTITLEMENTS
];

/**
 * Entitlements for platform owner (inherits from store owners)
 */
export const PLATFORM_OWNER_ENTITLEMENTS = [
  'CAN_MANAGE_PLATFORM',
  'CAN_MANAGE_ALL_STORES',
  'CAN_MANAGE_ALL_CLUBS',
  'CAN_ASSIGN_STORE_OWNERS',
  'CAN_VIEW_PLATFORM_ANALYTICS',
  'CAN_CREATE_STORES',
  'CAN_DELETE_STORES',
  'CAN_VIEW_ALL_STORES',
  'CAN_MANAGE_PLATFORM_SETTINGS',
  ...STORE_OWNER_ENTITLEMENTS
];

/**
 * Role hierarchy definition for inheritance
 */
export const ROLE_HIERARCHY = {
  // Platform level
  'PLATFORM_OWNER': ['PLATFORM_OWNER', 'STORE_OWNER', 'STORE_MANAGER', 'CLUB_LEAD', 'CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],

  // Store level
  'STORE_OWNER': ['STORE_OWNER', 'STORE_MANAGER', 'CLUB_LEAD', 'CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],
  'STORE_MANAGER': ['STORE_MANAGER', 'CLUB_LEAD', 'CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],

  // Club level
  'CLUB_LEAD': ['CLUB_LEAD', 'CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],
  'CLUB_MODERATOR': ['CLUB_MODERATOR', 'PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],

  // Membership tiers
  'PRIVILEGED_PLUS': ['PRIVILEGED_PLUS', 'PRIVILEGED', 'MEMBER'],
  'PRIVILEGED': ['PRIVILEGED', 'MEMBER'],
  'MEMBER': ['MEMBER']
};

/**
 * Get entitlements for a specific role
 */
export function getRoleEntitlements(role: string): string[] {
  switch (role) {
    case 'PLATFORM_OWNER':
      return PLATFORM_OWNER_ENTITLEMENTS;
    case 'STORE_OWNER':
      return STORE_OWNER_ENTITLEMENTS;
    case 'STORE_MANAGER':
      return STORE_MANAGER_ENTITLEMENTS;
    case 'CLUB_LEAD':
      return CLUB_LEAD_ENTITLEMENTS;
    case 'CLUB_MODERATOR':
      return CLUB_MODERATOR_ENTITLEMENTS;
    case 'PRIVILEGED_PLUS':
      return PRIVILEGED_PLUS_ENTITLEMENTS;
    case 'PRIVILEGED':
      return PRIVILEGED_ENTITLEMENTS;
    case 'MEMBER':
      return MEMBER_ENTITLEMENTS;
    default:
      return [];
  }
}
