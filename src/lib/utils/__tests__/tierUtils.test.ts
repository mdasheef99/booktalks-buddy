/**
 * Test Suite for Tier Utility Functions
 * 
 * Tests the tier conversion utilities to ensure proper handling of
 * database tier values (uppercase) and UI tier values (lowercase).
 * 
 * Created: 2025-07-10
 * Purpose: Verify tier badge display fix
 */

import {
  convertTierForUI,
  convertTierForDatabase,
  shouldShowTierBadge,
  getTierDisplayName,
  isValidTier,
  convertTierForSubscription,
} from '../tierUtils';

describe('tierUtils', () => {
  describe('convertTierForUI', () => {
    it('should convert database tiers to UI format', () => {
      expect(convertTierForUI('PRIVILEGED')).toBe('privileged');
      expect(convertTierForUI('PRIVILEGED_PLUS')).toBe('privileged_plus');
      expect(convertTierForUI('MEMBER')).toBe('member');
    });

    it('should handle case variations', () => {
      expect(convertTierForUI('privileged')).toBe('privileged');
      expect(convertTierForUI('Privileged')).toBe('privileged');
      expect(convertTierForUI('PRIVILEGED')).toBe('privileged');
    });

    it('should handle null/undefined/invalid values', () => {
      expect(convertTierForUI(null)).toBe(null);
      expect(convertTierForUI(undefined)).toBe(null);
      expect(convertTierForUI('')).toBe(null);
      expect(convertTierForUI('invalid')).toBe(null);
    });
  });

  describe('convertTierForDatabase', () => {
    it('should convert UI tiers to database format', () => {
      expect(convertTierForDatabase('privileged')).toBe('PRIVILEGED');
      expect(convertTierForDatabase('privileged_plus')).toBe('PRIVILEGED_PLUS');
      expect(convertTierForDatabase('member')).toBe('MEMBER');
    });

    it('should default to MEMBER for invalid values', () => {
      expect(convertTierForDatabase(null)).toBe('MEMBER');
      expect(convertTierForDatabase(undefined)).toBe('MEMBER');
      expect(convertTierForDatabase('')).toBe('MEMBER');
      expect(convertTierForDatabase('invalid')).toBe('MEMBER');
    });
  });

  describe('shouldShowTierBadge', () => {
    it('should return true for privileged tiers', () => {
      expect(shouldShowTierBadge('PRIVILEGED')).toBe(true);
      expect(shouldShowTierBadge('PRIVILEGED_PLUS')).toBe(true);
      expect(shouldShowTierBadge('privileged')).toBe(true);
      expect(shouldShowTierBadge('privileged_plus')).toBe(true);
    });

    it('should return false for member tier', () => {
      expect(shouldShowTierBadge('MEMBER')).toBe(false);
      expect(shouldShowTierBadge('member')).toBe(false);
    });

    it('should return false for invalid values', () => {
      expect(shouldShowTierBadge(null)).toBe(false);
      expect(shouldShowTierBadge(undefined)).toBe(false);
      expect(shouldShowTierBadge('')).toBe(false);
      expect(shouldShowTierBadge('invalid')).toBe(false);
    });
  });

  describe('getTierDisplayName', () => {
    it('should return proper display names', () => {
      expect(getTierDisplayName('PRIVILEGED')).toBe('Privileged');
      expect(getTierDisplayName('PRIVILEGED_PLUS')).toBe('Privileged Plus');
      expect(getTierDisplayName('MEMBER')).toBe('Member');
    });

    it('should default to Member for invalid values', () => {
      expect(getTierDisplayName(null)).toBe('Member');
      expect(getTierDisplayName(undefined)).toBe('Member');
      expect(getTierDisplayName('')).toBe('Member');
      expect(getTierDisplayName('invalid')).toBe('Member');
    });
  });

  describe('isValidTier', () => {
    it('should validate correct tier values', () => {
      expect(isValidTier('MEMBER')).toBe(true);
      expect(isValidTier('PRIVILEGED')).toBe(true);
      expect(isValidTier('PRIVILEGED_PLUS')).toBe(true);
      expect(isValidTier('member')).toBe(true);
      expect(isValidTier('privileged')).toBe(true);
      expect(isValidTier('privileged_plus')).toBe(true);
    });

    it('should reject invalid tier values', () => {
      expect(isValidTier(null)).toBe(false);
      expect(isValidTier(undefined)).toBe(false);
      expect(isValidTier('')).toBe(false);
      expect(isValidTier('invalid')).toBe(false);
      expect(isValidTier('free')).toBe(false);
    });
  });

  describe('convertTierForSubscription', () => {
    it('should convert database tiers to subscription format', () => {
      expect(convertTierForSubscription('PRIVILEGED')).toBe('privileged');
      expect(convertTierForSubscription('PRIVILEGED_PLUS')).toBe('privileged_plus');
    });

    it('should fallback to privileged for unknown tiers', () => {
      expect(convertTierForSubscription('MEMBER')).toBe('privileged');
      expect(convertTierForSubscription('UNKNOWN')).toBe('privileged');
      expect(convertTierForSubscription('')).toBe('privileged');
    });
  });

  describe('Integration Tests', () => {
    it('should handle round-trip conversions correctly', () => {
      const databaseTiers = ['MEMBER', 'PRIVILEGED', 'PRIVILEGED_PLUS'];

      databaseTiers.forEach(dbTier => {
        const uiTier = convertTierForUI(dbTier);
        const backToDb = convertTierForDatabase(uiTier);
        expect(backToDb).toBe(dbTier);
      });
    });

    it('should work with UserTierBadge component expectations', () => {
      // Test that our conversions work with the UserTierBadge component
      expect(convertTierForUI('PRIVILEGED')).toBe('privileged'); // Expected by UserTierBadge
      expect(convertTierForUI('PRIVILEGED_PLUS')).toBe('privileged_plus'); // Expected by UserTierBadge
    });

    it('should work with subscription table constraints', () => {
      // Test that our conversions work with the subscription table constraints
      expect(convertTierForSubscription('PRIVILEGED')).toBe('privileged'); // Expected by user_subscriptions table
      expect(convertTierForSubscription('PRIVILEGED_PLUS')).toBe('privileged_plus'); // Expected by user_subscriptions table
    });
  });
});
