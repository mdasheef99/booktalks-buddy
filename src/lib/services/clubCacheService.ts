/**
 * Club Cache Service
 *
 * Centralized caching utilities for club management operations.
 * Provides in-memory caching with TTL support and pattern-based invalidation.
 */

// =====================================================
// Types
// =====================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// =====================================================
// Cache Service Class
// =====================================================

export class ClubCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  /**
   * Store data in cache with optional expiry time
   */
  set<T>(key: string, data: T, expiry?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.DEFAULT_EXPIRY
    });
  }

  /**
   * Retrieve data from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Invalidate cache entries by pattern or clear all
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate all cache entries for a specific club
   */
  invalidateClub(clubId: string): void {
    this.invalidate(clubId);
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { size: number; keys: string[] } {
    const keys = Array.from(this.cache.keys());
    return {
      size: keys.length,
      keys
    };
  }

  /**
   * Clear expired entries manually (garbage collection)
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiry) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Check if a key exists in cache (regardless of expiry)
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get cache entry info without retrieving data
   */
  getEntryInfo(key: string): { exists: boolean; expired?: boolean; age?: number } {
    const entry = this.cache.get(key);
    if (!entry) {
      return { exists: false };
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    const expired = age > entry.expiry;

    return {
      exists: true,
      expired,
      age
    };
  }
}

// =====================================================
// Singleton Instance
// =====================================================

export const clubCacheService = new ClubCacheService();

// =====================================================
// Cache Key Generators
// =====================================================

export const CacheKeys = {
  analytics: (clubId: string) => `analytics:${clubId}`,
  analyticsHistory: (clubId: string, startDate?: string, endDate?: string, limit?: number) =>
    `snapshots:${clubId}:${startDate || 'all'}:${endDate || 'all'}:${limit || 30}`,
  moderators: (clubId: string) => `moderators:${clubId}`,
  members: (clubId: string) => `members:${clubId}`,
  eligibleMembers: (clubId: string) => `eligible:${clubId}`,
  // Phase 3: Events/Meetings cache keys
  meetings: (clubId: string, options?: any) =>
    `meetings:${clubId}:${JSON.stringify(options || {})}`,
  meeting: (clubId: string, meetingId: string) => `meeting:${clubId}:${meetingId}`,
  meetingAnalytics: (clubId: string) => `meetingAnalytics:${clubId}`,
  notifications: (clubId: string, userId: string, dismissed: boolean) =>
    `notifications:${clubId}:${userId}:${dismissed}`,
  clubEvents: (clubId: string) => `clubEvents:${clubId}`,
  // RSVP cache keys
  userRSVP: (meetingId: string, userId: string) => `rsvp:user:${meetingId}:${userId}`,
  meetingRSVPs: (meetingId: string) => `rsvp:meeting:${meetingId}`,
  meetingRSVPStats: (meetingId: string) => `rsvp:stats:${meetingId}`,
  clubRSVPStats: (clubId: string) => `rsvp:club:${clubId}`,
} as const;

// =====================================================
// Cache Utilities
// =====================================================

/**
 * Standard cache expiry times
 */
export const CacheExpiry = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 10 * 60 * 1000,      // 10 minutes
  HOUR: 60 * 60 * 1000,      // 1 hour
  DAY: 24 * 60 * 60 * 1000,  // 24 hours
} as const;

/**
 * Helper function to create cache-aware service methods
 */
export function withCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  expiry: number = CacheExpiry.MEDIUM,
  useCache: boolean = true
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try cache first if enabled
      if (useCache) {
        const cached = clubCacheService.get<T>(cacheKey);
        if (cached) {
          resolve(cached);
          return;
        }
      }

      // Fetch fresh data
      const data = await fetcher();

      // Cache the result
      clubCacheService.set(cacheKey, data, expiry);

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}
