/**
 * Backend Middleware Integration Tests
 * 
 * Tests for API middleware system from Phase 2 Task 3: Backend Enforcement Logic
 * Tests authentication, permission checking, and middleware composition
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import { 
  requireAuthentication,
  requirePermission,
  requireClubPermission,
  requireStorePermission,
  composeMiddleware,
  withAuth,
  withClubAdmin,
  withClubMember,
  withStoreAdmin,
  withPlatformAdmin
} from '../backend/middleware';
import { AuthenticatedRequest } from '../backend/types';

// Mock Supabase
vi.mock('../../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: { user: { id: 'user-123', email: 'test@example.com' } } }, 
        error: null 
      }))
    }
  }
}));

// Mock entitlements functions
vi.mock('../cache', () => ({
  getUserEntitlements: vi.fn(() => Promise.resolve(['CAN_MANAGE_CLUB', 'CAN_PARTICIPATE_IN_DISCUSSIONS']))
}));

vi.mock('../roles', () => ({
  hasPermissionAdvanced: vi.fn(() => Promise.resolve(true)),
  trackRoleActivity: vi.fn(() => Promise.resolve())
}));

describe('Backend Middleware System', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let nextFn: vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockReq = {
      headers: {},
      query: {},
      method: 'GET',
      url: '/api/test'
    };
    
    mockRes = {
      status: vi.fn(() => mockRes as NextApiResponse),
      json: vi.fn(() => mockRes as NextApiResponse)
    };
    
    nextFn = vi.fn();
  });

  describe('Authentication Middleware', () => {
    it('should authenticate user from Supabase session', async () => {
      const middleware = requireAuthentication();
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(nextFn).toHaveBeenCalled();
      expect((mockReq as AuthenticatedRequest).user).toEqual({
        id: 'user-123',
        email: 'test@example.com'
      });
    });

    it('should authenticate user from headers', async () => {
      const { supabase } = await import('../../supabase');
      
      // Mock no session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      });

      mockReq.headers = {
        'x-user-id': 'header-user-123',
        'x-user-email': 'header@example.com'
      };

      const middleware = requireAuthentication();
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(nextFn).toHaveBeenCalled();
      expect((mockReq as AuthenticatedRequest).user).toEqual({
        id: 'header-user-123',
        email: 'header@example.com'
      });
    });

    it('should reject unauthenticated requests', async () => {
      const { supabase } = await import('../../supabase');
      
      // Mock no session and no headers
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      });

      const middleware = requireAuthentication();
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    });

    it('should handle authentication errors gracefully', async () => {
      const { supabase } = await import('../../supabase');
      
      // Mock authentication error
      vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Auth error'));

      const middleware = requireAuthentication();
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Permission Middleware', () => {
    beforeEach(() => {
      // Set up authenticated request
      (mockReq as AuthenticatedRequest).user = {
        id: 'user-123',
        email: 'test@example.com'
      };
    });

    it('should allow requests with required permission', async () => {
      const middleware = requirePermission({
        entitlement: 'CAN_MANAGE_CLUB'
      });
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(nextFn).toHaveBeenCalled();
    });

    it('should deny requests without required permission', async () => {
      const { hasPermissionAdvanced } = await import('../roles');
      
      vi.mocked(hasPermissionAdvanced).mockResolvedValue(false);

      const middleware = requirePermission({
        entitlement: 'CAN_DELETE_CLUB'
      });
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        required: 'CAN_DELETE_CLUB',
        context: undefined
      });
    });

    it('should handle contextual permissions', async () => {
      mockReq.query = { clubId: 'club-123' };

      const middleware = requirePermission({
        entitlement: 'CAN_MANAGE_CLUB',
        contextId: (req) => req.query.clubId as string,
        contextType: 'club'
      });
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      const { hasPermissionAdvanced } = await import('../roles');
      
      expect(hasPermissionAdvanced).toHaveBeenCalledWith(
        'user-123',
        'CAN_MANAGE_CLUB',
        'club-123'
      );
      expect(nextFn).toHaveBeenCalled();
    });

    it('should use custom permission check', async () => {
      const customCheck = vi.fn(() => Promise.resolve(true));

      const middleware = requirePermission({
        entitlement: 'CAN_MANAGE_CLUB',
        customCheck
      });
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(customCheck).toHaveBeenCalledWith(mockReq);
      expect(nextFn).toHaveBeenCalled();
    });

    it('should track role activity when enabled', async () => {
      const middleware = requirePermission({
        entitlement: 'CAN_MANAGE_CLUB',
        contextType: 'club'
      });
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      const { trackRoleActivity } = await import('../roles');
      
      expect(trackRoleActivity).toHaveBeenCalledWith(
        'user-123',
        'CAN_MANAGE_CLUB',
        undefined,
        'club'
      );
    });

    it('should reject unauthenticated requests', async () => {
      // Remove user from request
      delete (mockReq as AuthenticatedRequest).user;

      const middleware = requirePermission({
        entitlement: 'CAN_MANAGE_CLUB'
      });
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Contextual Permission Middleware', () => {
    beforeEach(() => {
      (mockReq as AuthenticatedRequest).user = {
        id: 'user-123',
        email: 'test@example.com'
      };
    });

    it('should handle club permissions', async () => {
      mockReq.query = { clubId: 'club-123' };

      const middleware = requireClubPermission('CAN_MODERATE_DISCUSSIONS');
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      const { hasPermissionAdvanced } = await import('../roles');
      
      expect(hasPermissionAdvanced).toHaveBeenCalledWith(
        'user-123',
        'CAN_MODERATE_DISCUSSIONS',
        'club-123'
      );
    });

    it('should handle store permissions', async () => {
      mockReq.query = { storeId: 'store-123' };

      const middleware = requireStorePermission('CAN_MANAGE_STORE_SETTINGS');
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      const { hasPermissionAdvanced } = await import('../roles');
      
      expect(hasPermissionAdvanced).toHaveBeenCalledWith(
        'user-123',
        'CAN_MANAGE_STORE_SETTINGS',
        'store-123'
      );
    });
  });

  describe('Middleware Composition', () => {
    it('should compose multiple middleware functions', async () => {
      const middleware1 = vi.fn(async (req, res, next) => {
        (req as any).step1 = true;
        await next();
      });

      const middleware2 = vi.fn(async (req, res, next) => {
        (req as any).step2 = true;
        await next();
      });

      const composedMiddleware = composeMiddleware(middleware1, middleware2);
      
      await composedMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
      expect(nextFn).toHaveBeenCalled();
      expect((mockReq as any).step1).toBe(true);
      expect((mockReq as any).step2).toBe(true);
    });

    it('should stop execution if middleware fails', async () => {
      const middleware1 = vi.fn(async (req, res, next) => {
        res.status!(401).json!({ error: 'Unauthorized' });
        // Don't call next()
      });

      const middleware2 = vi.fn(async (req, res, next) => {
        await next();
      });

      const composedMiddleware = composeMiddleware(middleware1, middleware2);
      
      await composedMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).not.toHaveBeenCalled();
      expect(nextFn).not.toHaveBeenCalled();
    });
  });

  describe('Common Middleware Combinations', () => {
    it('should create auth middleware', async () => {
      const middleware = withAuth();
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect((mockReq as AuthenticatedRequest).user).toBeDefined();
    });

    it('should create club admin middleware', async () => {
      mockReq.query = { clubId: 'club-123' };

      const middleware = withClubAdmin();
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect((mockReq as AuthenticatedRequest).user).toBeDefined();
      expect(nextFn).toHaveBeenCalled();
    });

    it('should create club member middleware', async () => {
      mockReq.query = { clubId: 'club-123' };

      const middleware = withClubMember();
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect((mockReq as AuthenticatedRequest).user).toBeDefined();
      expect(nextFn).toHaveBeenCalled();
    });

    it('should create store admin middleware', async () => {
      mockReq.query = { storeId: 'store-123' };

      const middleware = withStoreAdmin();
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect((mockReq as AuthenticatedRequest).user).toBeDefined();
      expect(nextFn).toHaveBeenCalled();
    });

    it('should create platform admin middleware', async () => {
      const middleware = withPlatformAdmin();
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect((mockReq as AuthenticatedRequest).user).toBeDefined();
      expect(nextFn).toHaveBeenCalled();
    });

    it('should handle custom club ID parameter', async () => {
      mockReq.query = { id: 'club-123' };

      const middleware = withClubAdmin('id');
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      const { hasPermissionAdvanced } = await import('../roles');
      
      expect(hasPermissionAdvanced).toHaveBeenCalledWith(
        'user-123',
        'CAN_MANAGE_CLUB',
        'club-123'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle permission check errors', async () => {
      const { hasPermissionAdvanced } = await import('../roles');
      
      vi.mocked(hasPermissionAdvanced).mockRejectedValue(new Error('Permission check failed'));

      (mockReq as AuthenticatedRequest).user = {
        id: 'user-123',
        email: 'test@example.com'
      };

      const middleware = requirePermission({
        entitlement: 'CAN_MANAGE_CLUB'
      });
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Permission check failed'
      });
    });

    it('should handle tracking errors gracefully', async () => {
      const { trackRoleActivity } = await import('../roles');
      
      vi.mocked(trackRoleActivity).mockRejectedValue(new Error('Tracking failed'));

      (mockReq as AuthenticatedRequest).user = {
        id: 'user-123',
        email: 'test@example.com'
      };

      const middleware = requirePermission({
        entitlement: 'CAN_MANAGE_CLUB'
      });
      
      await middleware(
        mockReq as AuthenticatedRequest,
        mockRes as NextApiResponse,
        nextFn
      );

      // Should still proceed despite tracking error
      expect(nextFn).toHaveBeenCalled();
    });
  });
});
