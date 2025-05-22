/**
 * Backend Enforcement Logic Tests
 *
 * Comprehensive test suite for Phase 2 Task 3: Backend Enforcement Logic
 * Tests middleware, enforcement functions, and API integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  enforceClubCreationLimit,
  enforceClubJoiningLimit,
  enforceDirectMessagingLimit,
  enforcePremiumContentAccess
} from '../backend/enforcement';
import {
  requireAuthentication,
  requirePermission,
  composeMiddleware
} from '../backend/middleware';
import {
  trackRoleActivity,
  trackDetailedRoleActivity,
  getUserRoleActivityStats
} from '../backend/tracking';
import {
  extractUserId,
  extractContextId,
  createEnforcementErrorResponse,
  validateEnforcementParams
} from '../backend/utils';

// Mock Supabase with proper method chaining
vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          head: vi.fn(),
          is: vi.fn(() => ({
            head: true,
            count: 0
          }))
        })),
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        delete: vi.fn(() => ({
          lt: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })),
      count: 'exact'
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      }))
    }
  }
}));

// Mock cache functions
vi.mock('../cache', () => ({
  getUserEntitlements: vi.fn(() => Promise.resolve(['CAN_CREATE_LIMITED_CLUBS', 'CAN_JOIN_LIMITED_CLUBS']))
}));

// Mock membership functions
vi.mock('../membership', () => ({
  canCreateClub: vi.fn(() => Promise.resolve(true)),
  canJoinClub: vi.fn(() => Promise.resolve(true))
}));

describe('Backend Enforcement Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Club Creation Enforcement', () => {
    it('should allow club creation for users with unlimited entitlement', async () => {
      const { getUserEntitlements } = await import('../cache');
      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_CREATE_UNLIMITED_CLUBS']);

      const result = await enforceClubCreationLimit('user-1');

      expect(result.allowed).toBe(true);
    });

    it('should deny club creation for users without permission', async () => {
      const { getUserEntitlements } = await import('../cache');
      const { canCreateClub } = await import('../membership');

      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_VIEW_PUBLIC_CLUBS']);
      vi.mocked(canCreateClub).mockResolvedValue(false);

      const result = await enforceClubCreationLimit('user-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Membership tier does not allow club creation');
      expect(result.data?.upgradeRequired).toBe(true);
      expect(result.data?.requiredTier).toBe('PRIVILEGED');
    });

    it('should enforce 3-club limit for privileged users', async () => {
      const { getUserEntitlements } = await import('../cache');
      const { canCreateClub } = await import('../membership');
      const { supabase } = await import('../../supabase');

      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_CREATE_LIMITED_CLUBS']);
      vi.mocked(canCreateClub).mockResolvedValue(false);

      // Mock club count query
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              head: true,
              count: 3 // User has reached limit
            }))
          }))
        }))
      } as any);

      const result = await enforceClubCreationLimit('user-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Club creation limit reached (3 clubs)');
      expect(result.data?.currentCount).toBe(3);
      expect(result.data?.limit).toBe(3);
      expect(result.data?.requiredTier).toBe('PRIVILEGED_PLUS');
    });

    it('should check store-specific restrictions', async () => {
      const { getUserEntitlements } = await import('../cache');
      const { supabase } = await import('../../supabase');

      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_CREATE_LIMITED_CLUBS']);

      // Mock store query - store doesn't allow public club creation
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { allow_public_club_creation: false },
              error: null
            }))
          }))
        }))
      } as any);

      const result = await enforceClubCreationLimit('user-1', 'store-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('This store does not allow public club creation');
      expect(result.data?.storeRestriction).toBe(true);
    });
  });

  describe('Club Joining Enforcement', () => {
    it('should prevent duplicate membership', async () => {
      const { supabase } = await import('../../supabase');

      // Mock existing membership query
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { id: 'membership-1' },
                error: null
              }))
            }))
          }))
        }))
      } as any);

      const result = await enforceClubJoiningLimit('user-1', 'club-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('You are already a member of this club');
      expect(result.data?.alreadyMember).toBe(true);
    });

    it('should enforce 5-club limit for member users', async () => {
      const { getUserEntitlements } = await import('../cache');
      const { canJoinClub } = await import('../membership');
      const { supabase } = await import('../../supabase');

      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_JOIN_LIMITED_CLUBS']);
      vi.mocked(canJoinClub).mockResolvedValue(false);

      // Mock no existing membership
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - check existing membership
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null, error: null }))
                }))
              }))
            }))
          } as any;
        } else {
          // Second call - check club count
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                head: true,
                count: 5 // User has reached limit
              }))
            }))
          } as any;
        }
      });

      const result = await enforceClubJoiningLimit('user-1', 'club-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Club joining limit reached (5 clubs)');
      expect(result.data?.currentCount).toBe(5);
      expect(result.data?.limit).toBe(5);
    });

    it('should enforce premium club restrictions', async () => {
      const { getUserEntitlements } = await import('../cache');
      const { canJoinClub } = await import('../membership');
      const { supabase } = await import('../../supabase');

      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_JOIN_LIMITED_CLUBS']);
      vi.mocked(canJoinClub).mockResolvedValue(false);

      // Mock club queries
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - check existing membership
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null, error: null }))
                }))
              }))
            }))
          } as any;
        } else if (callCount === 2) {
          // Second call - check club details
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { is_premium: true, is_exclusive: false, name: 'Premium Club' },
                  error: null
                }))
              }))
            }))
          } as any;
        }
        return {} as any;
      });

      const result = await enforceClubJoiningLimit('user-1', 'club-1');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('This is a premium club');
      expect(result.data?.premiumRequired).toBe(true);
      expect(result.data?.requiredTier).toBe('PRIVILEGED');
    });
  });

  describe('Direct Messaging Enforcement', () => {
    it('should require Privileged+ membership', async () => {
      const { getUserEntitlements } = await import('../cache');

      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_JOIN_LIMITED_CLUBS']);

      const result = await enforceDirectMessagingLimit('user-1', 'user-2');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Direct messaging requires Privileged+ membership');
      expect(result.data?.requiredTier).toBe('PRIVILEGED_PLUS');
    });

    it('should check target user preferences', async () => {
      const { getUserEntitlements } = await import('../cache');
      const { supabase } = await import('../../supabase');

      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_SEND_DIRECT_MESSAGES']);

      // Mock target user query
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { allow_direct_messages: false, username: 'target_user' },
              error: null
            }))
          }))
        }))
      } as any);

      const result = await enforceDirectMessagingLimit('user-1', 'user-2');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('target_user has disabled direct messages');
      expect(result.data?.userRestriction).toBe(true);
    });
  });

  describe('Premium Content Access Enforcement', () => {
    it('should enforce premium content restrictions', async () => {
      const { getUserEntitlements } = await import('../cache');

      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_JOIN_LIMITED_CLUBS']);

      const result = await enforcePremiumContentAccess('user-1', 'premium');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Premium content requires PRIVILEGED membership');
      expect(result.data?.requiredTier).toBe('PRIVILEGED');
    });

    it('should enforce exclusive content restrictions', async () => {
      const { getUserEntitlements } = await import('../cache');

      vi.mocked(getUserEntitlements).mockResolvedValue(['CAN_ACCESS_PREMIUM_CONTENT']);

      const result = await enforcePremiumContentAccess('user-1', 'exclusive');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Exclusive content requires PRIVILEGED_PLUS membership');
      expect(result.data?.requiredTier).toBe('PRIVILEGED_PLUS');
    });
  });

  describe('Role Activity Tracking', () => {
    it('should track basic role activity', async () => {
      const { supabase } = await import('../../supabase');

      await trackRoleActivity('user-1', 'CLUB_LEAD', 'club-1', 'club');

      expect(supabase.rpc).toHaveBeenCalledWith('update_role_activity', {
        p_user_id: 'user-1',
        p_role_type: 'CLUB_LEAD',
        p_context_id: 'club-1',
        p_context_type: 'club'
      });
    });

    it('should track detailed role activity', async () => {
      const { supabase } = await import('../../supabase');

      await trackDetailedRoleActivity({
        userId: 'user-1',
        roleType: 'CLUB_LEAD',
        action: 'CREATE_CLUB',
        contextId: 'club-1',
        contextType: 'club',
        metadata: { clubName: 'Test Club' }
      });

      expect(supabase.from).toHaveBeenCalledWith('role_activity');
    });

    it('should get user role activity stats', async () => {
      const { supabase } = await import('../../supabase');

      // Mock activity data
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [
                  { role_type: 'CLUB_LEAD', action_performed: 'CREATE_CLUB', context_type: 'club' },
                  { role_type: 'CLUB_LEAD', action_performed: 'MANAGE_CLUB', context_type: 'club' }
                ],
                error: null
              }))
            }))
          }))
        }))
      } as any);

      const stats = await getUserRoleActivityStats('user-1', 'week');

      expect(stats.totalActions).toBe(2);
      expect(stats.roleUsage['CLUB_LEAD']).toBe(2);
      expect(stats.contextUsage['club']).toBe(2);
    });
  });

  describe('Utility Functions', () => {
    it('should extract user ID from headers', () => {
      const req = {
        headers: { 'x-user-id': 'user-123' }
      } as NextApiRequest;

      const userId = extractUserId(req);
      expect(userId).toBe('user-123');
    });

    it('should extract context ID from query parameters', () => {
      const req = {
        query: { clubId: 'club-123' }
      } as NextApiRequest;

      const contextId = extractContextId(req, 'club');
      expect(contextId).toBe('club-123');
    });

    it('should create enforcement error responses', () => {
      const req = { url: '/api/test' } as NextApiRequest;
      const result = {
        allowed: false,
        reason: 'Access denied',
        statusCode: 403,
        data: { upgradeRequired: true, requiredTier: 'PRIVILEGED' }
      };

      const response = createEnforcementErrorResponse(result, req);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
      expect(response.body.upgrade.required).toBe(true);
      expect(response.body.upgrade.requiredTier).toBe('PRIVILEGED');
    });

    it('should validate enforcement parameters', () => {
      const req = {
        query: { clubId: 'club-123' },
        body: { name: 'Test Club' }
      } as NextApiRequest;

      const validation = validateEnforcementParams(req, ['clubId', 'name']);

      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing parameters', () => {
      const req = {
        query: {},
        body: {}
      } as NextApiRequest;

      const validation = validateEnforcementParams(req, ['clubId', 'name']);

      expect(validation.valid).toBe(false);
      expect(validation.missing).toEqual(['clubId', 'name']);
    });
  });
});
