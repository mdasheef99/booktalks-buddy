/**
 * Role Classification System Tests
 * 
 * Comprehensive unit tests for the refactored role classification system.
 * Tests the modular architecture and ensures backward compatibility.
 * 
 * Created: 2025-01-11
 * Part of: Role Classification System Refactoring Validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabaseMock } from '@/test/setup';
import { 
  classifyUserRoles, 
  makeSubscriptionValidationDecision,
  logRoleClassificationDecision 
} from './roleClassification';
import type { 
  RoleClassification, 
  SubscriptionValidationDecision,
  AdministrativeRole,
  UserRole 
} from './roleClassification/types';

// Mock feature flags
vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn().mockImplementation((flag: string) => {
    if (flag === 'ROLE_CLASSIFICATION_OPTIMIZATION') return true;
    return false;
  })
}));

// Mock console.log for logging tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Role Classification System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('classifyUserRoles()', () => {
    it('should classify store owner as administrative role', async () => {
      // Mock store owner data
      supabaseMock.single.mockResolvedValueOnce({
        data: {
          user_id: 'store-owner-123',
          store_id: 'store-123',
          role: 'owner',
          created_at: '2024-01-01T00:00:00Z'
        },
        error: null
      });

      const result = await classifyUserRoles('store-owner-123');

      expect(result).toEqual({
        userId: 'store-owner-123',
        administrativeRoles: [{
          type: 'STORE_OWNER',
          storeId: 'store-123',
          grantedAt: '2024-01-01T00:00:00Z',
          source: 'store_users'
        }],
        userRoles: [],
        requiresSubscriptionValidation: false,
        exemptFromValidation: true,
        classificationReason: 'Administrative exemption: STORE_OWNER'
      });
    });

    it('should classify club leader as user role requiring validation', async () => {
      // Mock no administrative roles
      supabaseMock.single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock club leadership role
      supabaseMock.single.mockResolvedValueOnce({
        data: {
          user_id: 'club-leader-123',
          club_id: 'club-123',
          role: 'admin',
          joined_at: '2024-01-01T00:00:00Z'
        },
        error: null
      });

      const result = await classifyUserRoles('club-leader-123');

      expect(result).toEqual({
        userId: 'club-leader-123',
        administrativeRoles: [],
        userRoles: [{
          type: 'CLUB_LEADERSHIP',
          clubId: 'club-123',
          grantedAt: '2024-01-01T00:00:00Z',
          requiresSubscription: true
        }],
        requiresSubscriptionValidation: true,
        exemptFromValidation: false,
        classificationReason: 'User role enforcement: CLUB_LEADERSHIP'
      });
    });

    it('should classify regular member with no special roles', async () => {
      // Mock no administrative roles
      supabaseMock.single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock no club leadership roles
      supabaseMock.single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await classifyUserRoles('regular-member-123');

      expect(result).toEqual({
        userId: 'regular-member-123',
        administrativeRoles: [],
        userRoles: [],
        requiresSubscriptionValidation: false,
        exemptFromValidation: false,
        classificationReason: 'No special roles - standard member'
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      supabaseMock.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      await expect(classifyUserRoles('error-user-123')).rejects.toThrow(
        'Failed to classify user roles: Database connection failed'
      );
    });

    it('should complete classification within performance requirements', async () => {
      // Mock successful response
      supabaseMock.single.mockResolvedValue({
        data: null,
        error: null
      });

      const startTime = performance.now();
      await classifyUserRoles('performance-test-123');
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // <100ms requirement
    });

    it('should use consolidated query when optimization is enabled', async () => {
      // Mock consolidated query response
      supabaseMock.single.mockResolvedValueOnce({
        data: {
          user_id: 'optimized-user-123',
          administrative_roles: [],
          user_roles: []
        },
        error: null
      });

      await classifyUserRoles('optimized-user-123');

      // Verify consolidated query was called
      expect(supabaseMock.rpc).toHaveBeenCalledWith(
        'classify_user_roles_consolidated',
        { p_user_id: 'optimized-user-123' }
      );
    });
  });

  describe('makeSubscriptionValidationDecision()', () => {
    it('should return no validation needed for administrative users', async () => {
      // Mock administrative role classification
      vi.mocked(classifyUserRoles).mockResolvedValueOnce({
        userId: 'admin-123',
        administrativeRoles: [{
          type: 'STORE_OWNER',
          storeId: 'store-123',
          grantedAt: '2024-01-01T00:00:00Z',
          source: 'store_users'
        }],
        userRoles: [],
        requiresSubscriptionValidation: false,
        exemptFromValidation: true,
        classificationReason: 'Administrative exemption: STORE_OWNER'
      });

      const decision = await makeSubscriptionValidationDecision('admin-123');

      expect(decision).toEqual({
        shouldValidate: false,
        reason: 'Administrative exemption: STORE_OWNER',
        exemptRoles: [{
          type: 'STORE_OWNER',
          storeId: 'store-123',
          grantedAt: '2024-01-01T00:00:00Z',
          source: 'store_users'
        }],
        enforcedRoles: []
      });
    });

    it('should return validation needed for user roles', async () => {
      // Mock user role classification
      vi.mocked(classifyUserRoles).mockResolvedValueOnce({
        userId: 'user-123',
        administrativeRoles: [],
        userRoles: [{
          type: 'CLUB_LEADERSHIP',
          clubId: 'club-123',
          grantedAt: '2024-01-01T00:00:00Z',
          requiresSubscription: true
        }],
        requiresSubscriptionValidation: true,
        exemptFromValidation: false,
        classificationReason: 'User role enforcement: CLUB_LEADERSHIP'
      });

      const decision = await makeSubscriptionValidationDecision('user-123');

      expect(decision).toEqual({
        shouldValidate: true,
        reason: 'User role enforcement: CLUB_LEADERSHIP',
        exemptRoles: [],
        enforcedRoles: [{
          type: 'CLUB_LEADERSHIP',
          clubId: 'club-123',
          grantedAt: '2024-01-01T00:00:00Z',
          requiresSubscription: true
        }]
      });
    });

    it('should handle classification errors', async () => {
      // Mock classification error
      vi.mocked(classifyUserRoles).mockRejectedValueOnce(
        new Error('Classification failed')
      );

      await expect(makeSubscriptionValidationDecision('error-user-123'))
        .rejects.toThrow('Classification failed');
    });
  });

  describe('logRoleClassificationDecision()', () => {
    it('should log decision details correctly', () => {
      const decision: SubscriptionValidationDecision = {
        shouldValidate: true,
        reason: 'User role enforcement: CLUB_LEADERSHIP',
        exemptRoles: [],
        enforcedRoles: [{
          type: 'CLUB_LEADERSHIP',
          clubId: 'club-123',
          grantedAt: '2024-01-01T00:00:00Z',
          requiresSubscription: true
        }]
      };

      logRoleClassificationDecision('user-123', decision, 'test_context');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Role Classification] Decision for user user-123:',
        {
          shouldValidate: true,
          reason: 'User role enforcement: CLUB_LEADERSHIP',
          exemptRoles: 0,
          enforcedRoles: 1,
          context: 'test_context'
        }
      );
    });

    it('should use default context when none provided', () => {
      const decision: SubscriptionValidationDecision = {
        shouldValidate: false,
        reason: 'Administrative exemption',
        exemptRoles: [],
        enforcedRoles: []
      };

      logRoleClassificationDecision('admin-123', decision);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Role Classification] Decision for user admin-123:',
        expect.objectContaining({
          context: 'entitlement_calculation'
        })
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid user ID', async () => {
      await expect(classifyUserRoles('')).rejects.toThrow();
    });

    it('should handle null user ID', async () => {
      await expect(classifyUserRoles(null as any)).rejects.toThrow();
    });

    it('should handle malformed database responses', async () => {
      // Mock malformed response
      supabaseMock.single.mockResolvedValueOnce({
        data: { invalid: 'structure' },
        error: null
      });

      // Should handle gracefully and return default classification
      const result = await classifyUserRoles('malformed-123');
      expect(result.userId).toBe('malformed-123');
      expect(result.administrativeRoles).toEqual([]);
      expect(result.userRoles).toEqual([]);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain the same function signatures', () => {
      // Verify function signatures haven't changed
      expect(typeof classifyUserRoles).toBe('function');
      expect(classifyUserRoles.length).toBe(1); // One parameter

      expect(typeof makeSubscriptionValidationDecision).toBe('function');
      expect(makeSubscriptionValidationDecision.length).toBe(1); // One parameter

      expect(typeof logRoleClassificationDecision).toBe('function');
      expect(logRoleClassificationDecision.length).toBe(3); // Three parameters (third optional)
    });

    it('should return the same data structure as before refactoring', async () => {
      // Mock response
      supabaseMock.single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await classifyUserRoles('compatibility-test-123');

      // Verify all expected properties exist
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('administrativeRoles');
      expect(result).toHaveProperty('userRoles');
      expect(result).toHaveProperty('requiresSubscriptionValidation');
      expect(result).toHaveProperty('exemptFromValidation');
      expect(result).toHaveProperty('classificationReason');

      // Verify types
      expect(typeof result.userId).toBe('string');
      expect(Array.isArray(result.administrativeRoles)).toBe(true);
      expect(Array.isArray(result.userRoles)).toBe(true);
      expect(typeof result.requiresSubscriptionValidation).toBe('boolean');
      expect(typeof result.exemptFromValidation).toBe('boolean');
      expect(typeof result.classificationReason).toBe('string');
    });
  });

  describe('Modular Architecture Validation', () => {
    it('should successfully import from modular structure', async () => {
      // Test that the modular exports work correctly
      const roleClassModule = await import('./roleClassification');

      expect(roleClassModule.classifyUserRoles).toBeDefined();
      expect(roleClassModule.makeSubscriptionValidationDecision).toBeDefined();
      expect(roleClassModule.logRoleClassificationDecision).toBeDefined();
    });

    it('should import types correctly', async () => {
      // Test that types are properly exported
      const typesModule = await import('./roleClassification/types');

      expect(typesModule).toBeDefined();
      // Types should be available for TypeScript compilation
    });

    it('should import constants correctly', async () => {
      // Test that constants are properly exported
      const constantsModule = await import('./roleClassification/constants');

      expect(constantsModule).toBeDefined();
      expect(constantsModule.ADMINISTRATIVE_ROLE_TYPES).toBeDefined();
      expect(constantsModule.USER_ROLE_TYPES).toBeDefined();
    });
  });

  describe('Feature Flag Integration', () => {
    it('should use legacy query when optimization is disabled', async () => {
      // Mock feature flag to return false
      const { isFeatureEnabled } = await import('@/lib/feature-flags');
      vi.mocked(isFeatureEnabled).mockReturnValue(false);

      // Mock legacy query response
      supabaseMock.single.mockResolvedValue({
        data: null,
        error: null
      });

      await classifyUserRoles('legacy-test-123');

      // Should not call the consolidated RPC function
      expect(supabaseMock.rpc).not.toHaveBeenCalledWith(
        'classify_user_roles_consolidated',
        expect.any(Object)
      );
    });

    it('should handle feature flag errors gracefully', async () => {
      // Mock feature flag to throw error
      const { isFeatureEnabled } = await import('@/lib/feature-flags');
      vi.mocked(isFeatureEnabled).mockImplementation(() => {
        throw new Error('Feature flag service unavailable');
      });

      // Should fall back to legacy query
      supabaseMock.single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await classifyUserRoles('fallback-test-123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('fallback-test-123');
    });
  });

  describe('Integration with Membership System', () => {
    it('should be importable by membership.ts', async () => {
      // Test that the functions can be imported as expected by membership.ts
      const {
        makeSubscriptionValidationDecision,
        logRoleClassificationDecision
      } = await import('./roleClassification');

      expect(makeSubscriptionValidationDecision).toBeDefined();
      expect(logRoleClassificationDecision).toBeDefined();

      // Test that they can be called with expected parameters
      const mockDecision: SubscriptionValidationDecision = {
        shouldValidate: false,
        reason: 'Test reason',
        exemptRoles: [],
        enforcedRoles: []
      };

      // Should not throw when called
      expect(() => {
        logRoleClassificationDecision('test-user', mockDecision);
      }).not.toThrow();
    });
  });

  describe('Database Query Optimization', () => {
    it('should handle consolidated query response format', async () => {
      // Mock consolidated query response
      supabaseMock.rpc.mockResolvedValueOnce({
        data: {
          user_id: 'consolidated-test-123',
          administrative_roles: [
            {
              type: 'STORE_OWNER',
              store_id: 'store-123',
              granted_at: '2024-01-01T00:00:00Z',
              source: 'store_users'
            }
          ],
          user_roles: [],
          requires_subscription_validation: false,
          exempt_from_validation: true,
          classification_reason: 'Administrative exemption: STORE_OWNER'
        },
        error: null
      });

      const result = await classifyUserRoles('consolidated-test-123');

      expect(result.userId).toBe('consolidated-test-123');
      expect(result.administrativeRoles).toHaveLength(1);
      expect(result.administrativeRoles[0].type).toBe('STORE_OWNER');
      expect(result.exemptFromValidation).toBe(true);
    });

    it('should handle legacy query response format', async () => {
      // Disable optimization
      const { isFeatureEnabled } = await import('@/lib/feature-flags');
      vi.mocked(isFeatureEnabled).mockReturnValue(false);

      // Mock legacy query responses
      supabaseMock.single
        .mockResolvedValueOnce({
          data: {
            user_id: 'legacy-test-123',
            store_id: 'store-123',
            role: 'owner',
            created_at: '2024-01-01T00:00:00Z'
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: null
        });

      const result = await classifyUserRoles('legacy-test-123');

      expect(result.userId).toBe('legacy-test-123');
      expect(result.administrativeRoles).toHaveLength(1);
      expect(result.administrativeRoles[0].type).toBe('STORE_OWNER');
    });
  });
});
