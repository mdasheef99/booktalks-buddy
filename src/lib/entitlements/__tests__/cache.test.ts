import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserEntitlements,
  invalidateUserEntitlements,
  clearEntitlementsCache,
  getEntitlementsCacheTimestamp,
  isEntitlementsCacheExpired,
  getCachedUserIds,
  getEntitlementsCacheSize
} from '../cache';
import { calculateUserEntitlements } from '../index';

// Mock the calculateUserEntitlements function
vi.mock('../index', () => ({
  calculateUserEntitlements: vi.fn()
}));

describe('Entitlements Cache', () => {
  beforeEach(() => {
    // Clear the cache before each test
    clearEntitlementsCache();

    // Reset the mock
    vi.clearAllMocks();

    // Mock implementation of calculateUserEntitlements
    vi.mocked(calculateUserEntitlements).mockImplementation(
      async (userId: string) => {
        return [`ENTITLEMENT_FOR_${userId}`];
      }
    );
  });

  describe('getUserEntitlements', () => {
    it('should call calculateUserEntitlements and cache the result', async () => {
      const userId = 'user1';
      const entitlements = await getUserEntitlements(userId);

      expect(calculateUserEntitlements).toHaveBeenCalledWith(userId);
      expect(entitlements).toEqual([`ENTITLEMENT_FOR_${userId}`]);

      // Call again to use the cache
      await getUserEntitlements(userId);

      // calculateUserEntitlements should only be called once
      expect(calculateUserEntitlements).toHaveBeenCalledTimes(1);
    });

    it('should recalculate entitlements when forceRefresh is true', async () => {
      const userId = 'user1';

      // First call to cache the result
      await getUserEntitlements(userId);

      // Second call with forceRefresh
      await getUserEntitlements(userId, true);

      // calculateUserEntitlements should be called twice
      expect(calculateUserEntitlements).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidateUserEntitlements', () => {
    it('should remove the user from the cache', async () => {
      const userId = 'user1';

      // First call to cache the result
      await getUserEntitlements(userId);

      // Invalidate the cache
      invalidateUserEntitlements(userId);

      // Call again to recalculate
      await getUserEntitlements(userId);

      // calculateUserEntitlements should be called twice
      expect(calculateUserEntitlements).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearEntitlementsCache', () => {
    it('should clear the entire cache', async () => {
      const userId1 = 'user1';
      const userId2 = 'user2';

      // Cache entitlements for two users
      await getUserEntitlements(userId1);
      await getUserEntitlements(userId2);

      // Clear the cache
      clearEntitlementsCache();

      // Call again to recalculate
      await getUserEntitlements(userId1);
      await getUserEntitlements(userId2);

      // calculateUserEntitlements should be called four times
      expect(calculateUserEntitlements).toHaveBeenCalledTimes(4);
    });
  });

  describe('getEntitlementsCacheTimestamp', () => {
    it('should return the timestamp when the entitlements were cached', async () => {
      const userId = 'user1';

      // Cache the entitlements
      await getUserEntitlements(userId);

      // Get the timestamp
      const timestamp = getEntitlementsCacheTimestamp(userId);

      // Should be a number (timestamp)
      expect(typeof timestamp).toBe('number');
    });

    it('should return null if the user is not in the cache', () => {
      const userId = 'nonexistent';

      // Get the timestamp
      const timestamp = getEntitlementsCacheTimestamp(userId);

      // Should be null
      expect(timestamp).toBeNull();
    });
  });

  describe('isEntitlementsCacheExpired', () => {
    it('should return true if the user is not in the cache', () => {
      const userId = 'nonexistent';

      // Check if expired
      const isExpired = isEntitlementsCacheExpired(userId);

      // Should be true
      expect(isExpired).toBe(true);
    });

    it('should return false if the cache is fresh', async () => {
      const userId = 'user1';

      // Cache the entitlements
      await getUserEntitlements(userId);

      // Check if expired
      const isExpired = isEntitlementsCacheExpired(userId);

      // Should be false
      expect(isExpired).toBe(false);
    });
  });

  describe('getCachedUserIds', () => {
    it('should return an array of user IDs in the cache', async () => {
      const userId1 = 'user1';
      const userId2 = 'user2';

      // Cache entitlements for two users
      await getUserEntitlements(userId1);
      await getUserEntitlements(userId2);

      // Get the cached user IDs
      const userIds = getCachedUserIds();

      // Should contain both user IDs
      expect(userIds).toContain(userId1);
      expect(userIds).toContain(userId2);
      expect(userIds.length).toBe(2);
    });
  });

  describe('getEntitlementsCacheSize', () => {
    it('should return the number of users in the cache', async () => {
      const userId1 = 'user1';
      const userId2 = 'user2';

      // Cache entitlements for two users
      await getUserEntitlements(userId1);
      await getUserEntitlements(userId2);

      // Get the cache size
      const size = getEntitlementsCacheSize();

      // Should be 2
      expect(size).toBe(2);
    });
  });
});
