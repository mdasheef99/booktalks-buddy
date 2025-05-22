/**
 * Integration tests for the entitlements caching system
 *
 * These tests verify that the caching system works correctly with the
 * AuthContext and other components.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getUserEntitlements,
  invalidateUserEntitlements,
  clearEntitlementsCache,
  configureEntitlementsCache
} from '../cache';
import { calculateUserEntitlements } from '../membership';
import { initEntitlementsCache } from '../init';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock the calculateUserEntitlements function
vi.mock('../membership', () => ({
  calculateUserEntitlements: vi.fn()
}));

// Mock permissions functions
vi.mock('../permissions', () => ({
  hasEntitlement: (entitlements: string[], entitlement: string) =>
    entitlements.includes(entitlement),
  hasContextualEntitlement: (entitlements: string[], prefix: string, contextId: string) =>
    entitlements.includes(`${prefix}_${contextId}`)
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

describe('Entitlements Caching Integration', () => {
  beforeEach(() => {
    // Initialize the cache with test settings
    initEntitlementsCache();

    // Configure cache for testing
    configureEntitlementsCache({
      EXPIRATION: 5 * 60 * 1000, // 5 minutes
      KEY_PREFIX: 'test_entitlements_',
      VERSION: 1,
      DEBUG: false
    });

    // Clear the cache before each test
    clearEntitlementsCache();

    // Clear the sessionStorage mock
    mockSessionStorage.clear();

    // Reset all mocks
    vi.clearAllMocks();

    // Mock implementation of calculateUserEntitlements
    vi.mocked(calculateUserEntitlements).mockImplementation(
      async (userId: string) => {
        return [`ENTITLEMENT_FOR_${userId}`, 'CAN_CREATE_CLUB'];
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should cache entitlements and avoid unnecessary calculations', async () => {
    // First call should calculate entitlements
    const entitlements1 = await getUserEntitlements('test-user-id');
    expect(vi.mocked(calculateUserEntitlements)).toHaveBeenCalledTimes(1);
    expect(entitlements1).toContain('CAN_CREATE_CLUB');

    // Second call should use the cache
    const entitlements2 = await getUserEntitlements('test-user-id');
    expect(vi.mocked(calculateUserEntitlements)).toHaveBeenCalledTimes(1); // Still 1
    expect(entitlements2).toContain('CAN_CREATE_CLUB');

    // Force refresh should calculate again
    const entitlements3 = await getUserEntitlements('test-user-id', true);
    expect(vi.mocked(calculateUserEntitlements)).toHaveBeenCalledTimes(2);
    expect(entitlements3).toContain('CAN_CREATE_CLUB');
  });

  it('should invalidate cache when requested', async () => {
    // First call should calculate entitlements
    await getUserEntitlements('test-user-id');
    expect(vi.mocked(calculateUserEntitlements)).toHaveBeenCalledTimes(1);

    // Invalidate the cache
    invalidateUserEntitlements('test-user-id');

    // Next call should calculate again
    await getUserEntitlements('test-user-id');
    expect(vi.mocked(calculateUserEntitlements)).toHaveBeenCalledTimes(2);
  });

  it('should persist cache across multiple calls', async () => {
    // First call should calculate entitlements
    const entitlements1 = await getUserEntitlements('test-user-id');
    expect(vi.mocked(calculateUserEntitlements)).toHaveBeenCalledTimes(1);

    // Clear the mock calls but keep the cache
    vi.mocked(calculateUserEntitlements).mockClear();

    // Second call should use the cache and not call calculateUserEntitlements
    const entitlements2 = await getUserEntitlements('test-user-id');
    expect(vi.mocked(calculateUserEntitlements)).not.toHaveBeenCalled();
    expect(entitlements2).toEqual(entitlements1);
  });

  it('should handle cache expiration', async () => {
    // Configure cache with a very short expiration
    configureEntitlementsCache({
      EXPIRATION: 10, // 10ms expiration
      KEY_PREFIX: 'test_entitlements_',
      VERSION: 1,
      DEBUG: false
    });

    // First call should calculate entitlements
    await getUserEntitlements('test-user-id');
    expect(vi.mocked(calculateUserEntitlements)).toHaveBeenCalledTimes(1);

    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 20));

    // Next call should calculate again due to expiration
    await getUserEntitlements('test-user-id');
    expect(vi.mocked(calculateUserEntitlements)).toHaveBeenCalledTimes(2);
  });
});
