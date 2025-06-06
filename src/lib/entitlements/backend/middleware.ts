/**
 * API Middleware for Permission Checking
 *
 * This module provides middleware functions for automatic permission checking
 * in API routes, with support for role hierarchy and contextual permissions.
 */

import { NextApiResponse } from 'next';
import { supabase } from '../../supabase';
import { getUserEntitlements } from '../cache';
import { hasPermissionAdvanced, trackRoleActivity } from '../roles';
import { hasPermission } from '../permissions';
import { 
  AuthenticatedRequest, 
  ApiMiddleware, 
  PermissionRequirement,
  BackendEnforcementConfig 
} from './types';

/**
 * Default backend enforcement configuration
 */
const DEFAULT_CONFIG: BackendEnforcementConfig = {
  enableActivityTracking: true,
  enableMembershipLimits: true,
  enablePermissionCaching: true,
  cacheTtl: 300 // 5 minutes
};

/**
 * Global configuration for backend enforcement
 */
let globalConfig: BackendEnforcementConfig = { ...DEFAULT_CONFIG };

/**
 * Configure backend enforcement settings
 */
export function configureBackendEnforcement(config: Partial<BackendEnforcementConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Authentication middleware - extracts user from session or headers
 */
export function requireAuthentication(): ApiMiddleware {
  return async (req: AuthenticatedRequest, res: NextApiResponse, next: () => void | Promise<void>) => {
    try {
      let userId: string | null = null;
      let userEmail: string | null = null;

      // Try to get user from Supabase session first
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          userId = session.user.id;
          userEmail = session.user.email;
        }
      } catch (error) {
        console.warn('Could not get session from Supabase:', error);
      }

      // Fallback to header-based authentication (for development/testing)
      if (!userId) {
        userId = req.headers['x-user-id'] as string;
        userEmail = req.headers['x-user-email'] as string;
      }

      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Attach user information to request
      req.user = {
        id: userId,
        email: userEmail || undefined
      };

      await next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Authentication check failed'
      });
    }
  };
}

/**
 * Permission checking middleware
 */
export function requirePermission(requirement: PermissionRequirement): ApiMiddleware {
  return async (req: AuthenticatedRequest, res: NextApiResponse, next: () => void | Promise<void>) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const userId = req.user.id;
      let contextId: string | undefined;

      // Resolve context ID
      if (requirement.contextId) {
        if (typeof requirement.contextId === 'function') {
          contextId = requirement.contextId(req);
        } else {
          contextId = requirement.contextId;
        }
      }

      // Custom permission check
      if (requirement.customCheck) {
        const hasCustomPermission = await requirement.customCheck(req);
        if (!hasCustomPermission) {
          return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Insufficient permissions'
          });
        }
      } else {
        // Standard permission check using advanced role hierarchy
        const hasRequiredPermission = await hasPermissionAdvanced(
          userId,
          requirement.entitlement,
          contextId
        );

        if (!hasRequiredPermission) {
          return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Insufficient permissions',
            required: requirement.entitlement,
            context: contextId
          });
        }
      }

      // Track role activity if enabled
      if (globalConfig.enableActivityTracking) {
        await trackRoleActivity(
          userId,
          requirement.entitlement,
          contextId,
          requirement.contextType
        );
      }

      await next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Permission check failed'
      });
    }
  };
}

/**
 * Contextual permission middleware for club operations
 */
export function requireClubPermission(entitlement: string): ApiMiddleware {
  return requirePermission({
    entitlement,
    contextId: (req) => req.query.clubId as string,
    contextType: 'club'
  });
}

/**
 * Contextual permission middleware for store operations
 */
export function requireStorePermission(entitlement: string): ApiMiddleware {
  return requirePermission({
    entitlement,
    contextId: (req) => req.query.storeId as string,
    contextType: 'store'
  });
}

/**
 * Middleware composer - combines multiple middleware functions
 */
export function composeMiddleware(...middlewares: ApiMiddleware[]): ApiMiddleware {
  return async (req: AuthenticatedRequest, res: NextApiResponse, next: () => void | Promise<void>) => {
    let index = 0;

    const runNext = async (): Promise<void> => {
      if (index >= middlewares.length) {
        await next();
        return;
      }

      const middleware = middlewares[index++];
      await middleware(req, res, runNext);
    };

    await runNext();
  };
}

/**
 * Common middleware combinations
 */
export const withAuth = () => requireAuthentication();

export const withClubAdmin = (clubIdParam: string = 'clubId') => 
  composeMiddleware(
    requireAuthentication(),
    requirePermission({
      entitlement: 'CAN_MANAGE_CLUB',
      contextId: (req) => req.query[clubIdParam] as string,
      contextType: 'club'
    })
  );

export const withClubMember = (clubIdParam: string = 'clubId') =>
  composeMiddleware(
    requireAuthentication(),
    requirePermission({
      entitlement: 'CAN_PARTICIPATE_IN_DISCUSSIONS',
      contextId: (req) => req.query[clubIdParam] as string,
      contextType: 'club'
    })
  );

export const withStoreAdmin = (storeIdParam: string = 'storeId') =>
  composeMiddleware(
    requireAuthentication(),
    requirePermission({
      entitlement: 'CAN_MANAGE_STORE_SETTINGS',
      contextId: (req) => req.query[storeIdParam] as string,
      contextType: 'store'
    })
  );

export const withPlatformAdmin = () =>
  composeMiddleware(
    requireAuthentication(),
    requirePermission({
      entitlement: 'CAN_MANAGE_PLATFORM_SETTINGS',
      contextType: 'platform'
    })
  );
