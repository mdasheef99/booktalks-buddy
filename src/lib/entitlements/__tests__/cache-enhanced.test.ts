import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getUserEntitlements,
  invalidateUserEntitlements,
  clearEntitlementsCache,
  configureEntitlementsCache,
  getEntitlementsCacheStats,
  resetEntitlementsCacheStats,
  addCacheInvalidationListener,
  getEnhancedUserEntitlements,
  invalidateMultipleUsers,
  getMemoryCacheStats,
  preloadCache,
  cleanupExpiredCache,
  clearMemoryCache
} from '../cache';
import { calculateUserEntitlements } from '../membership';
import { getUserRoles } from '../roles';

// Mock the calculateUserEntitlements and getUserRoles functions
vi.mock('../membership', () => ({
  calculateUserEntitlements: vi.fn()
}));

vi.mock('../roles', () => ({
  getUserRoles: vi.fn()
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

describe('Enhanced Cache Features', () => {
  beforeEach(() => {
    // Configure cache for testing with enhanced features enabled
    configureEntitlementsCache({
      EXPIRATION: 5 * 60 * 1000, // 5 minutes
      KEY_PREFIX: 'test_entitlements_',
      VERSION: 1,
      DEBUG: false,
      REALTIME_ENABLED: true,
      MEMORY_CACHE_SIZE: 50,
      MEMORY_CACHE_TTL: 2 * 60 * 1000
    });

    // Clear both memory and storage cache before each test
    clearEntitlementsCache();
    clearMemoryCache();
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

    // Mock implementation of getUserRoles
    vi.mocked(getUserRoles).mockImplementation(
      async (userId: string) => {
        return [{ role: 'MEMBER', contextType: 'platform' as const }];
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getEnhancedUserEntitlements', () => {
    it('should return enhanced entitlements with roles and permissions', async () => {
      const userId = 'user1';
      const mockRoles = [
        { role: 'PRIVILEGED', contextType: 'platform' as const },
        { role: 'CLUB_LEAD', contextId: 'club-123', contextType: 'club' as const }
      ];

      vi.mocked(getUserRoles).mockResolvedValue(mockRoles);

      const enhanced = await getEnhancedUserEntitlements(userId);

      expect(enhanced).toBeTruthy();
      expect(enhanced?.entitlements).toEqual([`ENTITLEMENT_FOR_${userId}`]);
      expect(enhanced?.roles).toEqual(mockRoles);
      expect(enhanced?.permissions).toBeDefined();
      expect(enhanced?.computationTime).toBeDefined();
      expect(enhanced?.version).toBe(1); // Current test version
    });

    it('should return null for empty userId', async () => {
      const enhanced = await getEnhancedUserEntitlements('');
      expect(enhanced).toBeNull();
    });
  });

  describe('Memory Cache', () => {
    it('should track memory cache statistics', async () => {
      const userIds = ['user1', 'user2', 'user3'];

      // Load users into cache
      for (const userId of userIds) {
        await getUserEntitlements(userId);
      }

      const memoryStats = getMemoryCacheStats();
      expect(memoryStats.size).toBe(3);
      expect(memoryStats.totalAccess).toBe(3);
      expect(memoryStats.averageAccess).toBe(1);
    });

    it('should handle memory cache access counting', async () => {
      const userId = 'user1';

      // First access
      await getUserEntitlements(userId);

      // Second access (should hit memory cache)
      await getUserEntitlements(userId);

      const memoryStats = getMemoryCacheStats();
      expect(memoryStats.size).toBe(1);
      expect(memoryStats.totalAccess).toBe(2); // First load + second access
    });
  });

  describe('Cache Invalidation Listeners', () => {
    it('should notify listeners when cache is invalidated', async () => {
      const listener = vi.fn();
      const removeListener = addCacheInvalidationListener(listener);

      const userId = 'user1';
      await getUserEntitlements(userId);

      invalidateUserEntitlements(userId);

      expect(listener).toHaveBeenCalledWith(userId);

      // Remove listener and test it's not called
      removeListener();
      invalidateUserEntitlements('user2');

      expect(listener).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should handle multiple listeners', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      addCacheInvalidationListener(listener1);
      addCacheInvalidationListener(listener2);

      invalidateUserEntitlements('user1');

      expect(listener1).toHaveBeenCalledWith('user1');
      expect(listener2).toHaveBeenCalledWith('user1');
    });
  });

  describe('Multiple User Operations', () => {
    it('should invalidate multiple users', async () => {
      const userIds = ['user1', 'user2', 'user3'];

      // Cache all users
      for (const userId of userIds) {
        await getUserEntitlements(userId);
      }
      expect(calculateUserEntitlements).toHaveBeenCalledTimes(3);

      // Invalidate first two users
      invalidateMultipleUsers(['user1', 'user2']);

      // These should hit database again
      await getUserEntitlements('user1');
      await getUserEntitlements('user2');
      // This should still hit cache
      await getUserEntitlements('user3');

      expect(calculateUserEntitlements).toHaveBeenCalledTimes(5); // 3 + 2 new calls
    });

    it('should preload multiple users', async () => {
      const userIds = ['user1', 'user2', 'user3'];

      await preloadCache(userIds);
      expect(calculateUserEntitlements).toHaveBeenCalledTimes(3);

      // Subsequent calls should hit cache
      for (const userId of userIds) {
        await getUserEntitlements(userId);
      }

      expect(calculateUserEntitlements).toHaveBeenCalledTimes(3); // Still 3, no additional calls
    });
  });

  describe('Cache Cleanup', () => {
    it('should clean up expired cache entries', async () => {
      // Configure very short expiration for testing
      configureEntitlementsCache({
        EXPIRATION: 1, // 1ms expiration
        MEMORY_CACHE_TTL: 1
      });

      const userId = 'user1';
      await getUserEntitlements(userId);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cleanup should remove expired entries
      cleanupExpiredCache();

      // Next call should hit database again due to cleanup
      await getUserEntitlements(userId);
      expect(calculateUserEntitlements).toHaveBeenCalledTimes(2);
    });
  });
});
