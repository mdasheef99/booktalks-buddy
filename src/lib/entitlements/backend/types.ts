/**
 * Backend Enforcement Types
 *
 * Type definitions for backend enforcement functionality.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { UserRole } from '../roles';

/**
 * Extended API request with user information
 */
export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email?: string;
    roles?: UserRole[];
    entitlements?: string[];
  };
}

/**
 * Middleware function type for API routes
 */
export type ApiMiddleware = (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void | Promise<void>
) => void | Promise<void>;

/**
 * Permission requirement configuration
 */
export interface PermissionRequirement {
  /** Required entitlement */
  entitlement: string;
  /** Context ID for contextual permissions (e.g., club ID, store ID) */
  contextId?: string | ((req: AuthenticatedRequest) => string);
  /** Context type for role hierarchy checking */
  contextType?: 'platform' | 'store' | 'club';
  /** Custom permission checker function */
  customCheck?: (req: AuthenticatedRequest) => Promise<boolean>;
}

/**
 * Membership limit configuration
 */
export interface MembershipLimitConfig {
  /** Type of limit being enforced */
  limitType: 'club_creation' | 'club_joining' | 'direct_messages' | 'premium_access';
  /** Context for the limit check */
  context?: {
    userId?: string;
    clubId?: string;
    storeId?: string;
  };
}

/**
 * Role activity tracking data
 */
export interface RoleActivityData {
  /** User ID performing the action */
  userId: string;
  /** Role being used for the action */
  roleType: string;
  /** Action being performed */
  action: string;
  /** Context ID where the action is performed */
  contextId?: string;
  /** Context type */
  contextType?: 'platform' | 'store' | 'club';
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Backend enforcement configuration
 */
export interface BackendEnforcementConfig {
  /** Enable role activity tracking */
  enableActivityTracking?: boolean;
  /** Enable membership limit enforcement */
  enableMembershipLimits?: boolean;
  /** Enable permission caching */
  enablePermissionCaching?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
}

/**
 * Enforcement result
 */
export interface EnforcementResult {
  /** Whether the action is allowed */
  allowed: boolean;
  /** Reason for denial (if not allowed) */
  reason?: string;
  /** HTTP status code to return */
  statusCode?: number;
  /** Additional data */
  data?: any;
}
