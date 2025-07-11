/**
 * Subscription Features Module Tests
 * 
 * Unit tests for the subscription management features extracted from AuthContext.
 * Tests subscription validation, tier checking, and feature access control.
 * 
 * Created: 2025-01-11
 * Part of: AuthContext System Refactoring Validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  refreshSubscriptionStatus,
  hasValidSubscription,
  getSubscriptionTier,
  hasRequiredTier,
  canAccessFeature,
  getSubscriptionStatusWithContext
} from './subscriptions';
import type { User } from '@supabase/supabase-js';
import type { SubscriptionStatus } from '@/lib/api/subscriptions/types';

// Mock dependencies
vi.mock('@/lib/api/subscriptions/validation', () => ({
  validateUserSubscription: vi.fn(),
}));

describe('Subscription Features Module', () => {
  const mockSetSubscriptionStatus = vi.fn();
  const mockSetSubscriptionLoading = vi.fn();

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated'
  };

  const mockSubscriptionStatus: SubscriptionStatus = {
    hasActiveSubscription: true,
    currentTier: 'PRIVILEGED',
    isValid: true,
    subscriptionExpiry: '2024-12-31T23:59:59Z',
    lastValidated: '2024-01-01T12:00:00Z',
    validationSource: 'database'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('refreshSubscriptionStatus()', () => {
    it('should refresh subscription status successfully', async () => {
      const { validateUserSubscription } = await import('@/lib/api/subscriptions/validation');
      
      vi.mocked(validateUserSubscription).mockResolvedValue({
        success: true,
        status: mockSubscriptionStatus
      });

      await refreshSubscriptionStatus(
        mockUser,
        mockSetSubscriptionStatus,
        mockSetSubscriptionLoading
      );

      expect(mockSetSubscriptionLoading).toHaveBeenCalledWith(true);
      expect(validateUserSubscription).toHaveBeenCalledWith('user-123', {
        useCache: true,
        failSecure: true,
        timeout: 5000
      });
      expect(mockSetSubscriptionStatus).toHaveBeenCalledWith(mockSubscriptionStatus);
      expect(mockSetSubscriptionLoading).toHaveBeenCalledWith(false);
    });

    it('should handle null user', async () => {
      await refreshSubscriptionStatus(
        null,
        mockSetSubscriptionStatus,
        mockSetSubscriptionLoading
      );

      expect(mockSetSubscriptionStatus).toHaveBeenCalledWith(null);
      expect(mockSetSubscriptionLoading).toHaveBeenCalledWith(false);
    });

    it('should handle validation failure', async () => {
      const { validateUserSubscription } = await import('@/lib/api/subscriptions/validation');
      
      vi.mocked(validateUserSubscription).mockResolvedValue({
        success: false,
        status: null
      });

      await refreshSubscriptionStatus(
        mockUser,
        mockSetSubscriptionStatus,
        mockSetSubscriptionLoading
      );

      expect(mockSetSubscriptionStatus).toHaveBeenCalledWith(null);
      expect(mockSetSubscriptionLoading).toHaveBeenCalledWith(false);
    });

    it('should handle validation errors', async () => {
      const { validateUserSubscription } = await import('@/lib/api/subscriptions/validation');
      
      vi.mocked(validateUserSubscription).mockRejectedValue(
        new Error('Validation service unavailable')
      );

      await refreshSubscriptionStatus(
        mockUser,
        mockSetSubscriptionStatus,
        mockSetSubscriptionLoading
      );

      expect(mockSetSubscriptionStatus).toHaveBeenCalledWith(null);
      expect(mockSetSubscriptionLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('hasValidSubscription()', () => {
    it('should return true for valid active subscription', () => {
      const result = hasValidSubscription(mockSubscriptionStatus);
      expect(result).toBe(true);
    });

    it('should return false for inactive subscription', () => {
      const inactiveStatus: SubscriptionStatus = {
        ...mockSubscriptionStatus,
        hasActiveSubscription: false
      };
      
      const result = hasValidSubscription(inactiveStatus);
      expect(result).toBe(false);
    });

    it('should return false for invalid subscription', () => {
      const invalidStatus: SubscriptionStatus = {
        ...mockSubscriptionStatus,
        isValid: false
      };
      
      const result = hasValidSubscription(invalidStatus);
      expect(result).toBe(false);
    });

    it('should return false for null status', () => {
      const result = hasValidSubscription(null);
      expect(result).toBe(false);
    });
  });

  describe('getSubscriptionTier()', () => {
    it('should return correct tier from subscription status', () => {
      const result = getSubscriptionTier(mockSubscriptionStatus);
      expect(result).toBe('PRIVILEGED');
    });

    it('should return MEMBER for null status', () => {
      const result = getSubscriptionTier(null);
      expect(result).toBe('MEMBER');
    });

    it('should return MEMBER for undefined currentTier', () => {
      const statusWithoutTier = {
        ...mockSubscriptionStatus,
        currentTier: undefined as any
      };
      
      const result = getSubscriptionTier(statusWithoutTier);
      expect(result).toBe('MEMBER');
    });
  });

  describe('hasRequiredTier()', () => {
    it('should return true for PRIVILEGED user checking PRIVILEGED tier', () => {
      const result = hasRequiredTier(mockSubscriptionStatus, 'PRIVILEGED');
      expect(result).toBe(true);
    });

    it('should return true for PRIVILEGED_PLUS user checking PRIVILEGED tier', () => {
      const plusStatus: SubscriptionStatus = {
        ...mockSubscriptionStatus,
        currentTier: 'PRIVILEGED_PLUS'
      };
      
      const result = hasRequiredTier(plusStatus, 'PRIVILEGED');
      expect(result).toBe(true);
    });

    it('should return true for PRIVILEGED_PLUS user checking PRIVILEGED_PLUS tier', () => {
      const plusStatus: SubscriptionStatus = {
        ...mockSubscriptionStatus,
        currentTier: 'PRIVILEGED_PLUS'
      };
      
      const result = hasRequiredTier(plusStatus, 'PRIVILEGED_PLUS');
      expect(result).toBe(true);
    });

    it('should return false for PRIVILEGED user checking PRIVILEGED_PLUS tier', () => {
      const result = hasRequiredTier(mockSubscriptionStatus, 'PRIVILEGED_PLUS');
      expect(result).toBe(false);
    });

    it('should return false for MEMBER user checking any premium tier', () => {
      const memberStatus: SubscriptionStatus = {
        ...mockSubscriptionStatus,
        currentTier: 'MEMBER'
      };
      
      expect(hasRequiredTier(memberStatus, 'PRIVILEGED')).toBe(false);
      expect(hasRequiredTier(memberStatus, 'PRIVILEGED_PLUS')).toBe(false);
    });

    it('should return false for null status', () => {
      expect(hasRequiredTier(null, 'PRIVILEGED')).toBe(false);
      expect(hasRequiredTier(null, 'PRIVILEGED_PLUS')).toBe(false);
    });
  });

  describe('canAccessFeature()', () => {
    it('should allow access for non-premium features with entitlement', () => {
      const entitlements = ['CAN_READ_BOOKS'];
      const result = canAccessFeature(entitlements, mockSubscriptionStatus, 'CAN_READ_BOOKS');
      expect(result).toBe(true);
    });

    it('should deny access for non-premium features without entitlement', () => {
      const entitlements: string[] = [];
      const result = canAccessFeature(entitlements, mockSubscriptionStatus, 'CAN_READ_BOOKS');
      expect(result).toBe(false);
    });

    it('should allow access for premium features with entitlement and valid subscription', () => {
      const entitlements = ['CAN_ACCESS_PREMIUM_CONTENT'];
      const result = canAccessFeature(entitlements, mockSubscriptionStatus, 'CAN_ACCESS_PREMIUM_CONTENT');
      expect(result).toBe(true);
    });

    it('should deny access for premium features with entitlement but invalid subscription', () => {
      const entitlements = ['CAN_ACCESS_PREMIUM_CONTENT'];
      const invalidStatus: SubscriptionStatus = {
        ...mockSubscriptionStatus,
        isValid: false
      };
      
      const result = canAccessFeature(entitlements, invalidStatus, 'CAN_ACCESS_PREMIUM_CONTENT');
      expect(result).toBe(false);
    });

    it('should deny access for premium features without entitlement', () => {
      const entitlements: string[] = [];
      const result = canAccessFeature(entitlements, mockSubscriptionStatus, 'CAN_ACCESS_PREMIUM_CONTENT');
      expect(result).toBe(false);
    });

    it('should handle all premium feature types', () => {
      const entitlements = [
        'CAN_CREATE_LIMITED_CLUBS',
        'CAN_CREATE_UNLIMITED_CLUBS',
        'CAN_ACCESS_PREMIUM_CONTENT',
        'CAN_ACCESS_EXCLUSIVE_CONTENT',
        'CAN_JOIN_PREMIUM_CLUBS'
      ];

      entitlements.forEach(feature => {
        const result = canAccessFeature(entitlements, mockSubscriptionStatus, feature);
        expect(result).toBe(true);
      });
    });
  });

  describe('getSubscriptionStatusWithContext()', () => {
    it('should return context for valid subscription', () => {
      const result = getSubscriptionStatusWithContext(mockSubscriptionStatus);
      
      expect(result).toEqual({
        tier: 'PRIVILEGED',
        hasActiveSubscription: true,
        isValid: true,
        needsUpgrade: false,
        canUpgrade: true,
        context: 'Subscription active',
        expiryDate: '2024-12-31T23:59:59Z',
        lastValidated: '2024-01-01T12:00:00Z'
      });
    });

    it('should return context for invalid subscription', () => {
      const invalidStatus: SubscriptionStatus = {
        ...mockSubscriptionStatus,
        hasActiveSubscription: false,
        isValid: false
      };
      
      const result = getSubscriptionStatusWithContext(invalidStatus);
      
      expect(result).toEqual({
        tier: 'PRIVILEGED',
        hasActiveSubscription: false,
        isValid: false,
        needsUpgrade: true,
        canUpgrade: true,
        context: 'Subscription required for premium features',
        expiryDate: '2024-12-31T23:59:59Z',
        lastValidated: '2024-01-01T12:00:00Z'
      });
    });

    it('should return default context for null status', () => {
      const result = getSubscriptionStatusWithContext(null);
      
      expect(result).toEqual({
        tier: 'MEMBER',
        hasActiveSubscription: false,
        isValid: false,
        needsUpgrade: false,
        canUpgrade: true,
        context: 'No subscription data available'
      });
    });
  });

  describe('Function Signatures', () => {
    it('should maintain expected function signatures', () => {
      expect(typeof refreshSubscriptionStatus).toBe('function');
      expect(refreshSubscriptionStatus.length).toBe(3);

      expect(typeof hasValidSubscription).toBe('function');
      expect(hasValidSubscription.length).toBe(1);

      expect(typeof getSubscriptionTier).toBe('function');
      expect(getSubscriptionTier.length).toBe(1);

      expect(typeof hasRequiredTier).toBe('function');
      expect(hasRequiredTier.length).toBe(2);

      expect(typeof canAccessFeature).toBe('function');
      expect(canAccessFeature.length).toBe(3);

      expect(typeof getSubscriptionStatusWithContext).toBe('function');
      expect(getSubscriptionStatusWithContext.length).toBe(1);
    });
  });
});
