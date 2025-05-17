import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getUserEntitlements,
  invalidateUserEntitlements,
  clearEntitlementsCache,
  getEntitlementsCacheTimestamp,
  isEntitlementsCacheExpired,
  getCachedUserIds,
  getEntitlementsCacheSize,
  configureEntitlementsCache,
  getEntitlementsCacheStats,
  resetEntitlementsCacheStats
} from '../cache';
import { calculateUserEntitlements } from '../index';

// Mock the calculateUserEntitlements function
vi.mock('../index', () => ({
  calculateUserEntitlements: vi.fn()
}));

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Replace the global sessionStorage with our mock
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('Entitlements Cache', () => {
  beforeEach(() => {
    // Configure cache for testing
    configureEntitlementsCache({
      EXPIRATION: 5 * 60 * 1000, // 5 minutes
      KEY_PREFIX: 'test_entitlements_',
      VERSION: 1,
      DEBUG: false
    });

    // Clear the cache before each test
    clearEntitlementsCache();
    resetEntitlementsCacheStats();

    // Clear the sessionStorage mock
    mockSessionStorage.clear();

    // Reset all mocks
    vi.clearAllMocks();

    // Mock implementation of calculateUserEntitlements
    vi.mocked(calculateUserEntitlements).mockImplementation(
      async (userId: string) => {
        return [`ENTITLEMENT_FOR_${userId}`];
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
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

  describe('configureEntitlementsCache', () => {
    it('should update the cache configuration', async () => {
      // Configure with custom expiration
      const customExpiration = 10 * 60 * 1000; // 10 minutes
      configureEntitlementsCache({
        EXPIRATION: customExpiration,
        KEY_PREFIX: 'custom_prefix_',
        DEBUG: true
      });

      const userId = 'user1';

      // Cache entitlements
      await getUserEntitlements(userId);

      // Verify the cache key uses the new prefix
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('custom_prefix_'),
        expect.any(String)
      );
    });
  });

  describe('getEntitlementsCacheStats', () => {
    it('should track cache hits and misses', async () => {
      const userId = 'user1';

      // First call should be a miss
      await getUserEntitlements(userId);

      // Second call should be a hit
      await getUserEntitlements(userId);

      // Force refresh should be a miss
      await getUserEntitlements(userId, true);

      const stats = getEntitlementsCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
    });
  });

  describe('resetEntitlementsCacheStats', () => {
    it('should reset cache statistics', async () => {
      const userId = 'user1';

      // Generate some stats
      await getUserEntitlements(userId);
      await getUserEntitlements(userId);

      // Reset stats
      resetEntitlementsCacheStats();

      const stats = getEntitlementsCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.errors).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle sessionStorage errors gracefully', async () => {
      // Make sessionStorage.setItem throw an error
      mockSessionStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const userId = 'user1';

      // Should not throw despite storage error
      const entitlements = await getUserEntitlements(userId);

      // Should still return entitlements
      expect(entitlements).toEqual([`ENTITLEMENT_FOR_${userId}`]);

      // Should track the error
      const stats = getEntitlementsCacheStats();
      expect(stats.errors).toBeGreaterThan(0);
    });
  });
});
